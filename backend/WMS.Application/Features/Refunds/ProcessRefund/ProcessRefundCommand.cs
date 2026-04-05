using MediatR;

namespace WMS.Application.Features.Refunds.ProcessRefund;

public class ProcessRefundCommand : IRequest<ProcessRefundResult>
{
    public int ContractId { get; set; }
    public int? PaymentId { get; set; }
    public string Reason { get; set; } = null!;
    public int RequestedBy { get; set; }
}

public class ProcessRefundResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public int? RefundId { get; set; }
    public decimal? RefundAmount { get; set; }
    public decimal? CancellationFee { get; set; }
    public bool IsWithinGracePeriod { get; set; }
}
