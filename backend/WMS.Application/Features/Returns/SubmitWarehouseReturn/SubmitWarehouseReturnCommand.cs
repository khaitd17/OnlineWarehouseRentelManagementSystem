using MediatR;

namespace WMS.Application.Features.Returns.SubmitWarehouseReturn
{
    public class SubmitWarehouseReturnCommand : IRequest<SubmitWarehouseReturnResponse>
    {
        public int ContractId { get; set; }
        public int RenterId { get; set; }
        public bool IsClean { get; set; }
        public bool IsEquipmentIntact { get; set; }
        public bool IsNoOutstandingDebt { get; set; }
        public string? Notes { get; set; }
        public List<ReturnImageDto> Images { get; set; } = new();
    }

    public class ReturnImageDto
    {
        public string ImageUrl { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}