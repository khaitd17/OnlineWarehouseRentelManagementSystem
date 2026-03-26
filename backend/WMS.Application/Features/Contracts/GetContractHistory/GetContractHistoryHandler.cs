using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Contracts.GetContractHistory
{
    public class GetContractHistoryHandler : IRequestHandler<GetContractHistoryQuery, GetContractHistoryResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly IContractLogRepository _contractLogRepository;
        private readonly IContractExtensionRepository _extensionRepository;
        private readonly IRentalPaymentRepository _paymentRepository;
        private readonly IWarehouseReturnRepository _returnRepository;

        public GetContractHistoryHandler(
            IRentalContractRepository contractRepository,
            IContractLogRepository contractLogRepository,
            IContractExtensionRepository extensionRepository,
            IRentalPaymentRepository paymentRepository,
            IWarehouseReturnRepository returnRepository)
        {
            _contractRepository = contractRepository;
            _contractLogRepository = contractLogRepository;
            _extensionRepository = extensionRepository;
            _paymentRepository = paymentRepository;
            _returnRepository = returnRepository;
        }

        public async Task<GetContractHistoryResponse> Handle(GetContractHistoryQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy contract
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new GetContractHistoryResponse
                    {
                        Success = false,
                        Message = "Contract not found"
                    };
                }

                // Authorization check - chỉ renter hoặc owner/staff/admin mới được xem
                // TODO: Implement proper authorization logic

                // Lấy contract logs
                var logs = await _contractLogRepository.GetByContractIdAsync(request.ContractId);

                // Lấy extensions
                var extensions = await _extensionRepository.GetByOriginalContractIdAsync(request.ContractId);

                // Lấy payments
                var payments = await _paymentRepository.GetByContractIdAsync(request.ContractId);

                // Lấy return
                var warehouseReturn = await _returnRepository.GetByContractIdAsync(request.ContractId);

                return new GetContractHistoryResponse
                {
                    Success = true,
                    Message = "Contract history retrieved successfully",
                    Contract = new ContractHistoryDto
                    {
                        ContractId = contract.ContractId,
                        ContractNumber = contract.ContractNumber,
                        Status = contract.Status,
                        StartDate = contract.StartDate,
                        EndDate = contract.EndDate,
                        MonthlyPayment = contract.MonthlyPayment,
                        TotalValue = contract.TotalValue,
                        CreatedAt = contract.CreatedAt,
                        SignedAt = contract.SignedAt,
                        ReturnedAt = contract.ReturnedAt,
                        CancellationReason = contract.CancellationReason,
                        ParentContractId = contract.ParentContractId
                    },
                    Logs = logs.Select(log => new ContractLogDto
                    {
                        LogId = log.LogId,
                        Action = log.Action,
                        Description = log.Details,
                        CreatedAt = log.CreatedAt ?? DateTime.UtcNow,
                        UserName = "System"
                    }).ToList(),
                    Extensions = extensions.Select(ext => new ContractExtensionDto
                    {
                        ExtensionId = ext.ExtensionId,
                        Status = ext.Status,
                        DurationMonths = ext.DurationMonths,
                        ProposedMonthlyPayment = ext.ProposedMonthlyPayment,
                        RequestedAt = ext.RequestedAt,
                        ReviewedAt = ext.ReviewedAt,
                        RejectionReason = ext.RejectionReason,
                        NewContractId = ext.NewContractId
                    }).ToList(),
                    Payments = payments.ToList().Select(payment => new PaymentDto
                    {
                        PaymentId = payment.PaymentId,
                        PaymentType = payment.PaymentType,
                        Status = payment.Status,
                        Amount = payment.Amount,
                        PaymentCode = payment.PaymentCode,
                        CreatedAt = payment.CreatedAt,
                        PaidAt = payment.PaidAt
                    }).ToList(),
                    Return = warehouseReturn == null ? null : new WarehouseReturnDto
                    {
                        ReturnId = warehouseReturn.ReturnId,
                        Status = warehouseReturn.Status,
                        IsClean = warehouseReturn.IsClean,
                        IsEquipmentIntact = warehouseReturn.IsEquipmentIntact,
                        IsNoOutstandingDebt = warehouseReturn.IsNoOutstandingDebt,
                        DamageFee = warehouseReturn.DamageFee,
                        PenaltyFee = warehouseReturn.PenaltyFee,
                        CreatedAt = warehouseReturn.CreatedAt,
                        InspectionDate = warehouseReturn.InspectionDate
                    }
                };
            }
            catch (Exception ex)
            {
                return new GetContractHistoryResponse
                {
                    Success = false,
                    Message = $"Error retrieving contract history: {ex.Message}"
                };
            }
        }
    }
}