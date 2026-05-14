using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Entities;
using WMS.Domain.Models;

namespace WMS.Domain.Interfaces;

public interface IWarehouseGridLocationRepository
{
    Task<List<WarehouseGridLocation>> GetByWarehouseAsync(int warehouseId, int? renterId, CancellationToken ct);
    Task<List<WarehouseGridLocation>> GetByRequestItemsAsync(int warehouseId, List<int> assetIds, List<string> itemNames, CancellationToken ct);
    Task AssignGridLocationsAsync(int warehouseId, List<WarehouseGridLocation> assignments, CancellationToken ct);
    Task RemoveGridLocationByIdAsync(int warehouseId, int id, int quantityToRemove, CancellationToken ct);
    Task<List<GridInventoryStatusModel>> GetGridInventoryStatusAsync(int warehouseId, CancellationToken ct);
    Task ClearGridLocationsAsync(int warehouseId, CancellationToken ct);
}
