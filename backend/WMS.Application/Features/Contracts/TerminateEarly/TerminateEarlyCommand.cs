using MediatR;

namespace WMS.Application.Features.Contracts.TerminateEarly
{
    public class TerminateEarlyCommand : IRequest<TerminateEarlyResponse>
    {
        public int ContractId { get; set; }
        public string TerminationReason { get; set; } = string.Empty;
        public int UserId { get; set; } // Who is requesting termination
    }
}