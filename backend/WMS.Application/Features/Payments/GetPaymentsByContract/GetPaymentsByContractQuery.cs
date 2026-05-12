using MediatR;

namespace WMS.Application.Features.Payments.GetPaymentsByContract;

public class GetPaymentsByContractQuery : IRequest<List<PaymentDto>>
{
    public int ContractId { get; set; }
}

public class PaymentDto
{
    public int PaymentId { get; set; }
    public string PaymentCode { get; set; } = null!;
    public string PaymentType { get; set; } = null!;
    public string? PaymentMethod { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public string? TransactionCode { get; set; }
    public string? ProofUrl { get; set; }
    public string? ProofNote { get; set; }
    public DateTime? ProofSubmittedAt { get; set; }
    public DateTime? ProofRequestedAt { get; set; }
    public string? ProofRequestReason { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
