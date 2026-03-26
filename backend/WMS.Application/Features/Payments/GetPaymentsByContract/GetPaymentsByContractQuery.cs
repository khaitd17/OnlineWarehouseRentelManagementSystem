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
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
