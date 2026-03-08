using MediatR;

namespace WMS.Application.Features.Warehouses.ListWarehouses
{
    public class ListWarehousesCommand : IRequest<ListWarehousesResponse>
    {
        public int OwnerId { get; set; }

        public ListWarehousesCommand(int ownerId)
        {
            OwnerId = ownerId;
        }
    }

    public class ListWarehousesResponse
    {
        public List<WarehouseDto> Data { get; set; } = new();
    }

    public class WarehouseDto
    {
        public int WarehouseId { get; set; }
        public string Name { get; set; }
        public string Status { get; set; }
    }
}
