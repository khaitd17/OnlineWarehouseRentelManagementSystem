using MediatR;

namespace WMS.Application.Features.Payments.CreatePayment;

public class CreatePaymentCommand : IRequest<CreatePaymentResult>
{
    public int ContractId { get; set; }
    public string PaymentType { get; set; } = "DEPOSIT";
    // Backward-compatible alias for legacy frontend payloads using { amount }.
    public decimal? Amount { get; set; }
    public decimal? AmountOverride { get; set; }
    public string PaymentMethod { get; set; } = "BANK_TRANSFER"; // BANK_TRANSFER, CASH
    public string? Status { get; set; } // null = use default (PENDING), or PENDING_CONFIRMATION for cash
    public string? TransactionCode { get; set; }
    public string? ProofUrl { get; set; }
    public string? ProofNote { get; set; }
}

public class CreatePaymentResult
{
    public int PaymentId { get; set; }
    public string PaymentCode { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? ExpiredAt { get; set; }
}
