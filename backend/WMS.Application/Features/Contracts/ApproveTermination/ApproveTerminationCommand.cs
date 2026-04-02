using MediatR;

namespace WMS.Application.Features.Contracts.ApproveTermination
{
    public class ApproveTerminationCommand : IRequest<ApproveTerminationResponse>
    {
        public int ContractId { get; set; }
        public int UserId { get; set; } // Who is approving
    }
}
