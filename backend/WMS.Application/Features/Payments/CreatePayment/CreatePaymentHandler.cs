using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.CreatePayment;

public class CreatePaymentHandler : IRequestHandler<CreatePaymentCommand, CreatePaymentResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;

    public CreatePaymentHandler(
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
    }

    public async Task<CreatePaymentResult> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId);

        if (contract == null)
            throw new InvalidOperationException($"Contract {request.ContractId} not found");

        // Calculate amount based on payment type
        decimal amount = request.AmountOverride ?? request.PaymentType switch
        {
            PaymentType.Deposit => contract.DepositAmount ?? contract.MonthlyPayment,
            PaymentType.Monthly => contract.MonthlyPayment,
            _ => contract.MonthlyPayment
        };

        // Check if there's already a pending payment for this contract
        var existingPendingPayment = await _paymentRepo.GetPendingPaymentByContractAsync(
            request.ContractId,
            request.PaymentType);

        if (existingPendingPayment != null)
        {
            // Return existing pending payment
            return new CreatePaymentResult
            {
                PaymentId = existingPendingPayment.PaymentId,
                PaymentCode = existingPendingPayment.PaymentCode,
                Amount = existingPendingPayment.Amount,
                Status = existingPendingPayment.Status,
                ExpiredAt = existingPendingPayment.ExpiredAt
            };
        }

        // Create new payment
        var payment = RentalPayment.Create(
            contractId: request.ContractId,
            amount: amount,
            paymentType: request.PaymentType,
            expiryHours: 48
        );

        // Set payment method
        payment.PaymentMethod = request.PaymentMethod;

        // Override status if specified (e.g., for cash payments needing confirmation)
        if (!string.IsNullOrEmpty(request.Status))
        {
            payment.Status = request.Status;
        }

        var paymentId = await _paymentRepo.AddAsync(payment);

        // Set payment code after getting the ID
        payment.SetPaymentCode($"WMS{paymentId:D6}");
        await _paymentRepo.UpdateAsync(payment);

        // If cash payment, send notification to warehouse owner
        if (request.PaymentMethod == "CASH" && request.Status == "PENDING_CONFIRMATION")
        {
            await SendCashPaymentNotificationToOwner(contract, payment);
        }

        return new CreatePaymentResult
        {
            PaymentId = payment.PaymentId,
            PaymentCode = payment.PaymentCode,
            Amount = payment.Amount,
            Status = payment.Status,
            ExpiredAt = payment.ExpiredAt
        };
    }

    private async Task SendCashPaymentNotificationToOwner(RentalContract contract, RentalPayment payment)
    {
        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, CancellationToken.None);
        if (warehouse == null) return;

        var notification = new Notification
        {
            UserId = warehouse.OwnerId,
            Title = "💵 Yêu cầu xác nhận thanh toán tiền mặt",
            Message = $"Khách thuê đã yêu cầu xác nhận thanh toán tiền mặt {payment.Amount:N0}đ cho hợp đồng {contract.ContractNumber}. Vui lòng xác nhận nếu đã nhận tiền.",
            Type = "CASH_PAYMENT_PENDING",
            ReferenceId = payment.PaymentId,
            ReferenceType = "PAYMENT",
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(warehouse.OwnerId, notification);
    }
}
