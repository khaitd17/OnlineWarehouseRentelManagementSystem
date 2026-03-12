using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;

using Task = System.Threading.Tasks.Task;

namespace WMS.Infrastructure.Repositories;

public class WarehouseMediaRepository : IWarehouseMediaRepository
{
    private readonly ApplicationDbContext _context;

    public WarehouseMediaRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(
        int warehouseId,
        string mediaUrl,
        string mediaType,
        bool isPrimary,
        CancellationToken cancellationToken)
    {
        var entity = new WarehouseMedium
        {
            WarehouseId = warehouseId,
            MediaUrl = mediaUrl,
            MediaType = mediaType,
            IsPrimary = isPrimary,
            CreatedAt = DateTime.UtcNow
        };

        _context.WarehouseMedia.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<string>> GetByWarehouseIdAsync(
        int warehouseId,
        CancellationToken cancellationToken)
    {
        return await _context.WarehouseMedia
            .Where(x => x.WarehouseId == warehouseId)
            .OrderBy(x => x.DisplayOrder)
            .Select(x => x.MediaUrl)
            .ToListAsync(cancellationToken);
    }
}