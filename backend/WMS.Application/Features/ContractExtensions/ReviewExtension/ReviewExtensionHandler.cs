using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.ContractExtensions.ReviewExtension
{
    public class ReviewExtensionHandler : IRequestHandler<ReviewExtensionCommand, ReviewExtensionResponse>
    {
        private readonly IContractExtensionRepository _extensionRepository;
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public ReviewExtensionHandler(
            IContractExtensionRepository extensionRepository,
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _extensionRepository = extensionRepository;
            _contractRepository = contractRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
        }

        public async Task<ReviewExtensionResponse> Handle(ReviewExtensionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy extension request
                var extension = await _extensionRepository.GetByIdAsync(request.ExtensionId);
                if (extension == null)
                {
                    return new ReviewExtensionResponse
                    {
                        Success = false,
                        Message = "Extension request not found",
                        ExtensionId = request.ExtensionId
                    };
                }

                // Lấy original contract
                var originalContract = await _contractRepository.GetByIdAsync(extension.OriginalContractId);
                if (originalContract == null)
                {
                    return new ReviewExtensionResponse
                    {
                        Success = false,
                        Message = "Original contract not found",
                        ExtensionId = request.ExtensionId
                    };
                }

                if (request.Decision.ToUpper() == "APPROVE")
                {
                    // Approve và tạo new contract
                    var monthlyPayment = request.ApprovedMonthlyPayment ?? extension.ProposedMonthlyPayment ?? originalContract.MonthlyPayment;

                    // Tạo new contract với start date = original end date
                    var newContract = RentalContract.CreateFromRequest(
                        request: new RentalRequest
                        {
                            RenterId = originalContract.RenterId,
                            WarehouseId = originalContract.WarehouseId,
                            StartDate = originalContract.EndDate.AddDays(1),
                            DurationMonths = extension.DurationMonths,
                            Status = "APPROVED" // Fake approved status for factory method
                        },
                        monthlyPayment: monthlyPayment,
                        startDateOverride: originalContract.EndDate.AddDays(1),
                        durationMonthsOverride: extension.DurationMonths);

                    // Set parent contract reference
                    // Note: Cần thêm SetParentContract() method vào RentalContract
                    newContract.SetParentContract(originalContract.ContractId);

                    var newContractId = await _contractRepository.AddAsync(newContract);

                    // Approve extension
                    extension.Approve(request.ReviewerId, newContractId);
                    await _extensionRepository.UpdateAsync(extension);

                    // Gửi thông báo
                    var notification = new Notification
                    {
                        UserId = extension.RequesterId,
                        Title = "Contract Extension Approved",
                        Message = $"Your extension request has been approved! New contract {newContract.ContractNumber} created. Duration: {extension.DurationMonths} months, Monthly payment: {monthlyPayment:C}",
                        Type = "contract_extension_approved",
                        CreatedAt = DateTime.UtcNow
                    };

                    await _notificationRepository.AddAsync(notification);
                    await _notificationSender.SendToUserAsync(extension.RequesterId, notification);

                    return new ReviewExtensionResponse
                    {
                        Success = true,
                        Message = "Extension request approved successfully",
                        ExtensionId = request.ExtensionId,
                        Status = extension.Status,
                        NewContractId = newContractId,
                        NextSteps = $"New contract {newContract.ContractNumber} has been created and is ready for signing."
                    };
                }
                else if (request.Decision.ToUpper() == "REJECT")
                {
                    if (string.IsNullOrWhiteSpace(request.RejectionReason))
                    {
                        return new ReviewExtensionResponse
                        {
                            Success = false,
                            Message = "Rejection reason is required",
                            ExtensionId = request.ExtensionId
                        };
                    }

                    // Reject extension
                    extension.Reject(request.ReviewerId, request.RejectionReason);
                    await _extensionRepository.UpdateAsync(extension);

                    // Gửi thông báo
                    var notification = new Notification
                    {
                        UserId = extension.RequesterId,
                        Title = "Contract Extension Rejected",
                        Message = $"Your extension request has been rejected. Reason: {request.RejectionReason}",
                        Type = "contract_extension_rejected",
                        CreatedAt = DateTime.UtcNow
                    };

                    await _notificationRepository.AddAsync(notification);
                    await _notificationSender.SendToUserAsync(extension.RequesterId, notification);

                    return new ReviewExtensionResponse
                    {
                        Success = true,
                        Message = "Extension request rejected successfully",
                        ExtensionId = request.ExtensionId,
                        Status = extension.Status,
                        NextSteps = "The requester has been notified of the rejection."
                    };
                }
                else
                {
                    return new ReviewExtensionResponse
                    {
                        Success = false,
                        Message = "Invalid decision. Must be 'APPROVE' or 'REJECT'",
                        ExtensionId = request.ExtensionId
                    };
                }
            }
            catch (Exception ex)
            {
                return new ReviewExtensionResponse
                {
                    Success = false,
                    Message = $"Error reviewing extension: {ex.Message}",
                    ExtensionId = request.ExtensionId
                };
            }
        }
    }
}