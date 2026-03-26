using MediatR;

namespace WMS.Application.Features.Contracts.GetContracts
{
    public class GetContractsQuery : IRequest<GetContractsResponse>
    {
        public int? UserId { get; set; } // Filter by user if provided
        public string? Status { get; set; } // Filter by status
        public DateTime? StartDateFrom { get; set; }
        public DateTime? StartDateTo { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}