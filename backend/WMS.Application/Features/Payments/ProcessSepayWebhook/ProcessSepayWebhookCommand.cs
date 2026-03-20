using MediatR;

namespace WMS.Application.Features.Payments.ProcessSepayWebhook;

public class ProcessSepayWebhookCommand : IRequest<WebhookCommandResult>
{
    public int Id { get; set; }
    public string? Gateway { get; set; }
    public string? TransactionDate { get; set; }
    public string? AccountNumber { get; set; }
    public string? Code { get; set; }
    public string? Content { get; set; }
    public string? TransferType { get; set; }
    public decimal TransferAmount { get; set; }
    public decimal? Accumulated { get; set; }
    public string? SubAccount { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Description { get; set; }
    public string? IpAddress { get; set; }
}

public class WebhookCommandResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? PaymentCode { get; set; }
    public int? PaymentId { get; set; }
}
