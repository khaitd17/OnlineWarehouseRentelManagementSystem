using MediatR;

namespace WMS.Application.Features.Contracts.CompleteContract
{
    public class CompleteContractCommand : IRequest<CompleteContractResponse>
    {
        public int ContractId { get; set; }
        public int UserId { get; set; } // Who is marking as complete
        public string? Notes { get; set; }
    }
}