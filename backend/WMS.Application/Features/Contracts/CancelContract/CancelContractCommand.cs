using MediatR;

namespace WMS.Application.Features.Contracts.CancelContract
{
    public class CancelContractCommand : IRequest<CancelContractResponse>
    {
        public int ContractId { get; set; }
        public string CancellationReason { get; set; } = string.Empty;
        public int UserId { get; set; } // Who is cancelling
    }
}