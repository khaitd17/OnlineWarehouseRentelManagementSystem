using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public class ApproveRentalRequestHandler : IRequestHandler<ApproveRentalRequestCommand, int>
{
    private readonly IRentalRequestRepository _rentalRequestRepository;
    private readonly IRentalContractRepository _contractRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationSender _notificationSender;

    public ApproveRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IRentalContractRepository contractRepository,
        IWarehouseRepository warehouseRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _contractRepository = contractRepository;
        _warehouseRepository = warehouseRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
    }

    public async Task<int> Handle(ApproveRentalRequestCommand request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _rentalRequestRepository.GetByIdAsync(request.RequestId)
            ?? throw new InvalidOperationException("Rental request not found");

        var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.ReviewerId)
            throw new UnauthorizedAccessException("Only warehouse owner can approve requests");

        if (warehouse.AvailableArea < rentalRequest.RequestedArea)
            throw new InvalidOperationException("Warehouse no longer has enough available area");

        // Approve the request
        rentalRequest.Approve(request.ReviewerId, request.ContractImageUrl);
        await _rentalRequestRepository.UpdateAsync(rentalRequest);

        // Create contract with DRAFT status (waiting for renter to sign)
        var contract = RentalContract.CreateFromRequest(
            rentalRequest,
            request.MonthlyPayment,
            request.DepositAmount,
            request.Terms
        );
        var contractId = await _contractRepository.AddAsync(contract);

        // Deduct approved area from warehouse available area
        warehouse.AvailableArea -= rentalRequest.RequestedArea;
        await _warehouseRepository.UpdateAsync(warehouse, cancellationToken);

        // Send notification to renter
        var notification = new Notification
        {
            UserId = rentalRequest.RenterId,
            Title = "Yêu cầu thuê kho đã được duyệt",
            Message = $"Yêu cầu thuê kho {warehouse.Name} đã được duyệt. Hợp đồng #{contract.ContractNumber} đã được tạo.",
            Type = "CONTRACT_APPROVED",
            ReferenceId = contractId,
            ReferenceType = "CONTRACT"
        };
        await _notificationRepository.AddAsync(notification);
        await _notificationSender.SendToUserAsync(rentalRequest.RenterId, notification);

        return contractId;
    }
}
