using MediatR;

namespace WMS.Application.Features.Contracts.CloseContract
{
    public class CloseContractCommand : IRequest<CloseContractResponse>
    {
        public int ContractId { get; set; }
        public int UserId { get; set; } // Who is closing
        public decimal? DamageCompensation { get; set; }
        public string? Notes { get; set; }
    }
}