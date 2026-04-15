using MediatR;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.GetPaymentStatus;

public class GetPaymentStatusHandler : IRequestHandler<GetPaymentStatusQuery, PaymentStatusResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly ISepayService _sepayService;
    private readonly ILogger<GetPaymentStatusHandler> _logger;

    public GetPaymentStatusHandler(
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        ISepayService sepayService,
        ILogger<GetPaymentStatusHandler> logger)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _sepayService = sepayService;
        _logger = logger;
    }

    public async Task<PaymentStatusResult> Handle(GetPaymentStatusQuery request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepo.GetByIdAsync(request.PaymentId);

        if (payment == null)
            throw new InvalidOperationException($"Payment {request.PaymentId} not found");

        // Repair inconsistent state from missed/late webhook: payment is completed but contract still pending.
        if (payment.IsCompleted)
        {
            await TryReconcileContractAfterCompletedPaymentAsync(payment);
        }
        // Fallback sync path: query SePay API for the current payment code.
        else if (CanTrySyncFromSepay(payment))
        {
            var syncedCurrentPayment = await TrySyncFromSepayAsync(payment);

            // If current payment code has no match, try sibling payments of the same contract/type
            // to handle duplicate pending rows caused by concurrent create requests.
            if (!syncedCurrentPayment)
            {
                var matchedSiblingPayment = await TrySyncSiblingPaymentAsync(payment);
                if (matchedSiblingPayment != null)
                {
                    payment = matchedSiblingPayment;
                }
            }
        }

        // If there is a newer completed payment of the SAME payment type in this contract,
        // return it to avoid stale pending rows. Do not mix deposit/monthly/penalty flows.
        if (!payment.IsCompleted)
        {
            var completedPayments = await _paymentRepo.GetCompletedByContractIdAsync(payment.ContractId)
                                   ?? Enumerable.Empty<WMS.Domain.Entities.RentalPayment>();

            var completedPayment = completedPayments
                .Where(p => p.PaymentType == payment.PaymentType)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();

            if (completedPayment != null)
            {
                payment = completedPayment;
            }
        }

        return new PaymentStatusResult
        {
            PaymentId = payment.PaymentId,
            PaymentCode = payment.PaymentCode,
            Status = payment.Status,
            Amount = payment.Amount,
            PaidAt = payment.PaidAt,
            ExpiredAt = payment.ExpiredAt,
            IsExpired = payment.IsExpired,
            SepayTransactionId = payment.SepayTransactionId,
            SepayReferenceCode = payment.SepayReferenceCode
        };
    }

    private static bool CanTrySyncFromSepay(WMS.Domain.Entities.RentalPayment payment)
    {
        var allowedStatuses = payment.Status == PaymentStatus.Pending
                              || payment.Status == PaymentStatus.Failed
                              || payment.Status == PaymentStatus.Expired
                              || payment.Status == PaymentStatus.RetryPending;

        return allowedStatuses
               && payment.SepayTransactionId == null
               && !string.IsNullOrWhiteSpace(payment.PaymentCode);
    }

    private async Task<bool> TrySyncFromSepayAsync(WMS.Domain.Entities.RentalPayment payment)
    {
        try
        {
            var transaction = await _sepayService.CheckTransactionAsync(payment.PaymentCode);
            if (transaction == null || transaction.Id <= 0 || transaction.Amount <= 0)
                return false;

            var codeInContent = !string.IsNullOrWhiteSpace(transaction.Content)
                                && transaction.Content.Contains(payment.PaymentCode, StringComparison.OrdinalIgnoreCase);

            var codeInReference = !string.IsNullOrWhiteSpace(transaction.ReferenceCode)
                                  && transaction.ReferenceCode.Contains(payment.PaymentCode, StringComparison.OrdinalIgnoreCase);

            if (!codeInContent && !codeInReference)
            {
                _logger.LogWarning(
                    "SePay fallback found transaction {TransactionId} but payment code {PaymentCode} was not present in content/reference",
                    transaction.Id,
                    payment.PaymentCode);
                return false;
            }

            var expectedAmount = await GetExpectedAmountAsync(payment);
            if (expectedAmount <= 0)
            {
                _logger.LogWarning(
                    "SePay fallback skipped payment {PaymentCode} because expected amount is invalid ({ExpectedAmount})",
                    payment.PaymentCode,
                    expectedAmount);
                return false;
            }

            if (transaction.Amount < expectedAmount)
            {
                _logger.LogWarning(
                    "SePay fallback found insufficient amount for payment {PaymentCode}. Required={Required}, Actual={Actual}",
                    payment.PaymentCode,
                    expectedAmount,
                    transaction.Amount);
                return false;
            }

            payment.CompleteFromSepay(transaction.Id, transaction.ReferenceCode ?? string.Empty);
            await _paymentRepo.UpdateAsync(payment);

            await TryReconcileContractAfterCompletedPaymentAsync(payment);

            _logger.LogInformation(
                "Payment {PaymentCode} synchronized from SePay API fallback. TransactionId={TransactionId}",
                payment.PaymentCode,
                transaction.Id);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SePay fallback synchronization failed for payment {PaymentCode}", payment.PaymentCode);
            return false;
        }
    }

    private async Task<WMS.Domain.Entities.RentalPayment?> TrySyncSiblingPaymentAsync(WMS.Domain.Entities.RentalPayment currentPayment)
    {
        var payments = await _paymentRepo.GetByContractIdAsync(currentPayment.ContractId)
                       ?? Enumerable.Empty<WMS.Domain.Entities.RentalPayment>();

        var orderedPayments = payments
            .OrderByDescending(p => p.CreatedAt)
            .ToList();

        // Sibling reconciliation is meant for the "newest pending but older code was paid" race.
        // If current payment is not the latest one, avoid scanning siblings to reduce SePay load.
        if (orderedPayments.FirstOrDefault()?.PaymentId != currentPayment.PaymentId)
            return null;

        var candidates = orderedPayments
            .Where(p => p.PaymentId != currentPayment.PaymentId
                        && p.PaymentType == currentPayment.PaymentType
                        && CanTrySyncFromSepay(p))
            .Take(3)
            .ToList();

        foreach (var candidate in candidates)
        {
            var synced = await TrySyncFromSepayAsync(candidate);
            if (synced)
                return candidate;
        }

        return null;
    }

    private async Task<decimal> GetExpectedAmountAsync(WMS.Domain.Entities.RentalPayment payment)
    {
        if (payment.Amount > 0)
            return payment.Amount;

        var contract = await _contractRepo.GetByIdAsync(payment.ContractId);
        if (contract == null)
            return 0;

        var depositAmount = contract.DepositAmount.GetValueOrDefault();
        if (depositAmount <= 0)
            depositAmount = contract.MonthlyPayment;

        var monthlyAmount = contract.MonthlyPayment > 0 ? contract.MonthlyPayment : depositAmount;

        if (payment.PaymentType == PaymentType.Penalty)
            return contract.EarlyTerminationFee.GetValueOrDefault();

        return payment.PaymentType == PaymentType.Deposit ? depositAmount : monthlyAmount;
    }

    private async Task TryReconcileContractAfterCompletedPaymentAsync(WMS.Domain.Entities.RentalPayment payment)
    {
        var contract = await _contractRepo.GetByIdAsync(payment.ContractId);
        if (contract == null)
            return;

        if (contract.IsPendingPayment)
        {
            contract.ActivateAfterPayment();
            await _contractRepo.UpdateAsync(contract);

            _logger.LogInformation("Activated pending contract {ContractId} from payment status reconciliation", payment.ContractId);
            return;
        }

        if (payment.PaymentType == PaymentType.Penalty && contract.Status == RentalContractStatus.PendingTermination)
        {
            await _contractRepo.FinalizeTerminationAfterPaymentAsync(payment.ContractId);
            _logger.LogInformation(
                "Finalized pending termination contract {ContractId} after completed penalty payment",
                payment.ContractId);
        }
    }
}
