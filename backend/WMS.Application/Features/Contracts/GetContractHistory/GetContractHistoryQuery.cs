using MediatR;

namespace WMS.Application.Features.Contracts.GetContractHistory
{
    public class GetContractHistoryQuery : IRequest<GetContractHistoryResponse>
    {
        public int ContractId { get; set; }
        public int UserId { get; set; } // For authorization check
    }
}