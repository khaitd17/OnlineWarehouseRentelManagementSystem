using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Repositories;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly ApplicationDbContext _context;

    public WarehouseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task AddAsync(WMS.Domain.Entities.Warehouse warehouse)
    {
        var model = new WMS.Infrastructure.Persistence.ScaffoldModels.Warehouse
        {
            Name = warehouse.Name,
            Description = warehouse.Description,
            Address = warehouse.Address
        };

        await _context.Warehouses.AddAsync(model);
        await _context.SaveChangesAsync();
    }

    public async Task<int?> FindWarehouseOwnerById(int id, CancellationToken tk)
    {
        return await _context.Warehouses
            .Where(x => x.WarehouseId == id)
            .Select(x => (int?)x.OwnerId)
            .FirstOrDefaultAsync(tk);
    }

    public async Task<List<WMS.Domain.Interfaces.WarehouseListDto>> GetWarehousesByOwnerIdAsync(int ownerId, CancellationToken tk = default)
    {
        return await _context.Warehouses
            .Where(x => x.OwnerId == ownerId)
            .Select(x => new WMS.Domain.Interfaces.WarehouseListDto(
                x.WarehouseId,
                x.Name,
                x.Status
            ))
            .ToListAsync(tk);
    }
}