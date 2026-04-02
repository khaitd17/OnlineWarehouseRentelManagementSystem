using MediatR;

namespace WMS.Application.Features.Contracts.RejectTermination
{
    public class RejectTerminationCommand : IRequest<RejectTerminationResponse>
    {
        public int ContractId { get; set; }
        public int UserId { get; set; } // Who is rejecting
        public string? RejectReason { get; set; }
    }
}
