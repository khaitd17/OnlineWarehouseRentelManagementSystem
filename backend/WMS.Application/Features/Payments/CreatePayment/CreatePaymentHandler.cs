using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.CreatePayment;

public class CreatePaymentHandler : IRequestHandler<CreatePaymentCommand, CreatePaymentResult>
{
    private const double PaymentExpiryHours = 10.0 / 60.0; // 10 minutes

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

        var requestedAmount = request.AmountOverride ?? request.Amount;

        // Calculate contract-based amount with safe fallback when deposit/monthly values are missing or zero.
        var defaultDepositAmount = contract.DepositAmount.GetValueOrDefault();
        if (defaultDepositAmount <= 0)
            defaultDepositAmount = contract.MonthlyPayment;

        var defaultMonthlyAmount = contract.MonthlyPayment > 0
            ? contract.MonthlyPayment
            : defaultDepositAmount;

        var defaultPenaltyAmount = contract.EarlyTerminationFee.GetValueOrDefault();

        if (request.PaymentType == PaymentType.Penalty)
        {
            if (contract.Status != RentalContractStatus.PendingTermination)
                throw new InvalidOperationException("Only pending termination contracts can create penalty payments.");

            if (!contract.OwnerApprovedTermination || !contract.RenterApprovedTermination)
                throw new InvalidOperationException("Both parties must approve early termination before creating penalty payment.");

            if (defaultPenaltyAmount <= 0)
                throw new InvalidOperationException("Early termination fee is not configured or invalid.");
        }

        var calculatedAmount = request.PaymentType switch
        {
            PaymentType.Deposit => defaultDepositAmount,
            PaymentType.Monthly => defaultMonthlyAmount,
            PaymentType.Penalty => defaultPenaltyAmount,
            _ => defaultMonthlyAmount
        };

        var isManualConfirmation = request.Status == PaymentStatus.PendingConfirmation
                                   && (request.PaymentMethod == "CASH" || request.PaymentMethod == "BANK_TRANSFER");

        if (isManualConfirmation)
        {
            if (string.IsNullOrWhiteSpace(request.ProofUrl))
                throw new InvalidOperationException("Vui lòng tải lên chứng từ thanh toán.");
            if (string.IsNullOrWhiteSpace(request.TransactionCode))
                throw new InvalidOperationException("Vui lòng nhập mã giao dịch.");
        }

        var amount = requestedAmount.HasValue && requestedAmount.Value > 0
            ? requestedAmount.Value
            : calculatedAmount;

        if (isManualConfirmation)
        {
            amount = calculatedAmount;
        }

        if (amount <= 0)
            throw new InvalidOperationException("Payment amount must be greater than 0. Please check contract pricing information.");

        var isCashConfirmationRequest = request.PaymentMethod == "CASH"
                                        && request.Status == "PENDING_CONFIRMATION";

        // Check if there's already a pending payment for this contract
        var existingPendingPayment = await _paymentRepo.GetPendingPaymentByContractAsync(
            request.ContractId,
            request.PaymentType);

        if (isCashConfirmationRequest || isManualConfirmation)
        {
            var existingCashConfirmation = (await _paymentRepo.GetByContractIdAsync(request.ContractId))
                .FirstOrDefault(p =>
                    p.PaymentType == request.PaymentType
                    && (p.PaymentMethod == "CASH" || p.PaymentMethod == "BANK_TRANSFER")
                    && (p.Status == "PENDING_CONFIRMATION" || p.Status == PaymentStatus.ReuploadRequested));

            if (existingCashConfirmation != null)
            {
                if (isManualConfirmation)
                {
                    ApplyPaymentProof(existingCashConfirmation, request);
                    existingCashConfirmation.Status = PaymentStatus.PendingConfirmation;
                    await _paymentRepo.UpdateAsync(existingCashConfirmation);
                    await SendCashPaymentNotificationToOwner(contract, existingCashConfirmation);
                }

                return new CreatePaymentResult
                {
                    PaymentId = existingCashConfirmation.PaymentId,
                    PaymentCode = existingCashConfirmation.PaymentCode,
                    Amount = existingCashConfirmation.Amount,
                    Status = existingCashConfirmation.Status,
                    ExpiredAt = existingCashConfirmation.ExpiredAt
                };
            }
        }

        if (existingPendingPayment != null)
        {
            if (isManualConfirmation)
            {
                // Convert the existing pending payment into a manual confirmation request
                ApplyPaymentProof(existingPendingPayment, request);
                existingPendingPayment.PaymentMethod = request.PaymentMethod;
                existingPendingPayment.Status = PaymentStatus.PendingConfirmation;
                await _paymentRepo.UpdateAsync(existingPendingPayment);
                await SendCashPaymentNotificationToOwner(contract, existingPendingPayment);

                return new CreatePaymentResult
                {
                    PaymentId = existingPendingPayment.PaymentId,
                    PaymentCode = existingPendingPayment.PaymentCode,
                    Amount = existingPendingPayment.Amount,
                    Status = existingPendingPayment.Status,
                    ExpiredAt = existingPendingPayment.ExpiredAt.HasValue
                        ? DateTime.SpecifyKind(existingPendingPayment.ExpiredAt.Value, DateTimeKind.Utc)
                        : null
                };
            }

            if (!isCashConfirmationRequest)
            {
                // Recover from stale/invalid pending records (e.g., old amount = 0) by regenerating payment.
                if (existingPendingPayment.Amount <= 0)
                {
                    existingPendingPayment.MarkFailed();
                    await _paymentRepo.UpdateAsync(existingPendingPayment);
                }
                else
                {
                    // Normalize legacy pending payments to the current expiry policy (24h max from now).
                    var maxAllowedExpiry = DateTime.UtcNow.AddHours(PaymentExpiryHours);
                    if (!existingPendingPayment.ExpiredAt.HasValue || existingPendingPayment.ExpiredAt.Value > maxAllowedExpiry)
                    {
                        existingPendingPayment.UpdateExpiry(maxAllowedExpiry);
                        await _paymentRepo.UpdateAsync(existingPendingPayment);
                    }

                    // Return existing pending payment
                    return new CreatePaymentResult
                    {
                        PaymentId = existingPendingPayment.PaymentId,
                        PaymentCode = existingPendingPayment.PaymentCode,
                        Amount = existingPendingPayment.Amount,
                        Status = existingPendingPayment.Status,
                        ExpiredAt = existingPendingPayment.ExpiredAt.HasValue
                            ? DateTime.SpecifyKind(existingPendingPayment.ExpiredAt.Value, DateTimeKind.Utc)
                            : null
                    };
                }
            }
        }

        // Create new payment using a transaction to ensure PaymentCode is finalized atomically
        var payment = RentalPayment.Create(
            contractId: request.ContractId,
            amount: amount,
            paymentType: request.PaymentType,
            expiryHours: PaymentExpiryHours
        );

        // Set payment method
        payment.PaymentMethod = request.PaymentMethod;

        // Override status if specified (e.g., for cash payments needing confirmation)
        if (!string.IsNullOrEmpty(request.Status))
        {
            payment.Status = request.Status;
        }

        if (isManualConfirmation)
        {
            ApplyPaymentProof(payment, request);
        }

        // Persist payment and immediately finalize its code in one round-trip
        var paymentId = await _paymentRepo.AddAsync(payment);

        // Set final payment code (WMS + 6-digit padded ID) and persist
        payment.SetPaymentCode($"WMS{paymentId:D6}");
        await _paymentRepo.UpdatePaymentCodeAsync(paymentId, payment.PaymentCode);

        // If cash payment, send notification to warehouse owner
        if (isManualConfirmation)
        {
            await SendCashPaymentNotificationToOwner(contract, payment);
        }

        return new CreatePaymentResult
        {
            PaymentId = payment.PaymentId,
            PaymentCode = payment.PaymentCode,
            Amount = payment.Amount,
            Status = payment.Status,
            ExpiredAt = payment.ExpiredAt.HasValue
                ? DateTime.SpecifyKind(payment.ExpiredAt.Value, DateTimeKind.Utc)
                : null
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

    private static void ApplyPaymentProof(RentalPayment payment, CreatePaymentCommand request)
    {
        payment.UpdatePaymentProof(
            request.TransactionCode?.Trim(),
            request.ProofUrl?.Trim(),
            request.ProofNote?.Trim());
    }
}
