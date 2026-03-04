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
}