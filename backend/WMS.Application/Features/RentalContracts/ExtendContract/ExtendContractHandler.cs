using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.ExtendContract;

public class ExtendContractHandler : IRequestHandler<ExtendContractCommand, ExtendContractResult>
{
    private readonly IRentalContractRepository _contractRepository;
    private readonly IRentalPaymentRepository _paymentRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly ISepayService _sepayService;

    public ExtendContractHandler(
        IRentalContractRepository contractRepository,
        IRentalPaymentRepository paymentRepository,
        INotificationRepository notificationRepository,
        ISepayService sepayService)
    {
        _contractRepository = contractRepository;
        _paymentRepository = paymentRepository;
        _notificationRepository = notificationRepository;
        _sepayService = sepayService;
    }

    public async Task<ExtendContractResult> Handle(ExtendContractCommand request, CancellationToken cancellationToken)
    {
        // 1. Get contract
        var contract = await _contractRepository.GetByIdWithDetailsAsync(request.ContractId);

        if (contract == null)
        {
            return new ExtendContractResult
            {
                Success = false,
                Message = "Không tìm thấy hợp đồng"
            };
        }

        // 2. Validate contract can be extended
        if (contract.Status != RentalContractStatus.Active)
        {
            return new ExtendContractResult
            {
                Success = false,
                Message = $"Không thể gia hạn hợp đồng với trạng thái {contract.Status}"
            };
        }

        // 3. Validate renter
        if (contract.RenterId != request.RequestedBy)
        {
            return new ExtendContractResult
            {
                Success = false,
                Message = "Bạn không có quyền gia hạn hợp đồng này"
            };
        }

        // 4. Calculate extension amount
        var extensionAmount = contract.MonthlyPayment * request.ExtensionMonths;
        var newEndDate = contract.EndDate.AddMonths(request.ExtensionMonths);

        // 5. Create extension payment
        var payment = RentalPayment.Create(
            contractId: contract.ContractId,
            amount: extensionAmount,
            paymentType: "EXTENSION",
            expiryHours: 48
        );

        await _paymentRepository.AddAsync(payment);

        // 6. Generate QR code for payment
        var qrInfo = _sepayService.GenerateQrInfo(
            payment.PaymentCode,
            extensionAmount,
            $"Gia han HD {contract.ContractNumber} - {request.ExtensionMonths} thang"
        );

        // 7. Notify renter
        var notification = Notification.Create(
            receiverUserId: contract.RenterId,
            title: "Yêu cầu gia hạn hợp đồng",
            message: $"Thanh toán {extensionAmount:N0} VNĐ để gia hạn hợp đồng {contract.ContractNumber} thêm {request.ExtensionMonths} tháng. Hạn thanh toán: 48 giờ.",
            notificationType: "IN_APP",
            referenceId: payment.PaymentId,
            referenceType: "RentalPayment"
        );
        await _notificationRepository.AddAsync(notification);

        return new ExtendContractResult
        {
            Success = true,
            Message = "Yêu cầu gia hạn đã được tạo. Vui lòng thanh toán trong 48 giờ.",
            PaymentId = payment.PaymentId,
            PaymentCode = payment.PaymentCode,
            QrCodeUrl = qrInfo.QrImageUrl,
            ExtensionAmount = extensionAmount,
            NewEndDate = newEndDate
        };
    }
}
