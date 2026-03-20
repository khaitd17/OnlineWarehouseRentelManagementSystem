using MediatR;

namespace WMS.Application.Features.ContractExtensions.RequestExtension
{
    public class RequestExtensionCommand : IRequest<RequestExtensionResponse>
    {
        public int OriginalContractId { get; set; }
        public int RequesterId { get; set; }
        public int DurationMonths { get; set; }
        public decimal? ProposedMonthlyPayment { get; set; }
        public string? Notes { get; set; }
    }
}