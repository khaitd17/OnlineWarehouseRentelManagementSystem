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
        // Simple mapping for demonstration, you might need fuller mapping
        var model = new WMS.Infrastructure.Persistence.ScaffoldModels.Warehouse
        {
            Name = warehouse.Name,
            Description = warehouse.Description,
            Address = warehouse.Address
            // ...
        };
        await _context.Warehouses.AddAsync(model);
        await _context.SaveChangesAsync();
    }

    public async Task<WMS.Domain.Entities.Warehouse?> GetByIdAsync(int id)
    {
        var scaffoldWarehouse = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.WarehouseId == id);
        
        if (scaffoldWarehouse == null)
            return null;

        return new WMS.Domain.Entities.Warehouse(
            name: scaffoldWarehouse.Name,
            description: scaffoldWarehouse.Description ?? string.Empty,
            address: scaffoldWarehouse.Address,
            city: "N/A", // TODO: Add to database schema
            province: "N/A", // TODO: Add to database schema
            area: scaffoldWarehouse.TotalArea,
            pricePerMonth: 0, // TODO: Add to database schema
            warehouseType: "General", // TODO: Add to database schema
            capacity: 0, // TODO: Add to database schema
            ownerId: scaffoldWarehouse.OwnerId
        );
    }

    public async Task<int?> FindWarehouseOwnerById(int id, CancellationToken tk)
    {
        return await _context.Warehouses
            .Where(x => x.WarehouseId == id)
            .Select(x => (int?)x.OwnerId)
            .FirstOrDefaultAsync(tk);
    }
}