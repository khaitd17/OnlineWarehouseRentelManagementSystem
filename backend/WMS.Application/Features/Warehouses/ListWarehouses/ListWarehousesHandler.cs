using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.ListWarehouses
{
    public class ListWarehousesHandler : IRequestHandler<ListWarehousesCommand, ListWarehousesResponse>
    {
        private readonly IWarehouseRepository _warehouseRepository;

        public ListWarehousesHandler(IWarehouseRepository warehouseRepository)
        {
            _warehouseRepository = warehouseRepository;
        }

        public async Task<ListWarehousesResponse> Handle(
            ListWarehousesCommand request,
            CancellationToken cancellationToken)
        {
            var warehouses = await _warehouseRepository.GetWarehousesByOwnerIdAsync(
                request.OwnerId, cancellationToken);

            return new ListWarehousesResponse
            {
                Data = warehouses.Select(w => new WarehouseDto
                {
                    WarehouseId = w.WarehouseId,
                    Name = w.Name,
                    Status = w.Status
                }).ToList()
            };
        }
    }
}
