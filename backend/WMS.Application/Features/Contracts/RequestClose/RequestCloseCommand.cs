using MediatR;

namespace WMS.Application.Features.Contracts.RequestClose
{
    public class RequestCloseCommand : IRequest<RequestCloseResponse>
    {
        public int ContractId { get; set; }
        public int UserId { get; set; }
    }
}
