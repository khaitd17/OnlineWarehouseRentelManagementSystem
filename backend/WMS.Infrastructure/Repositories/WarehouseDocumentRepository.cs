using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;


namespace WMS.Infrastructure.Repositories;

public class WarehouseDocumentRepository : IWarehouseDocumentRepository
{
    private readonly ApplicationDbContext _context;

    public WarehouseDocumentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task AddAsync(
        int warehouseId,
        string documentType,
        string documentUrl,
        CancellationToken cancellationToken)
    {
        var entity = new WarehouseDocument
        {
            WarehouseId = warehouseId,
            DocumentType = documentType,
            DocumentUrl = documentUrl,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };

        _context.WarehouseDocuments.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<WarehouseDocument>> GetByWarehouseIdAsync(
        int warehouseId,
        CancellationToken cancellationToken)
    {
        return await _context.WarehouseDocuments
            .Where(d => d.WarehouseId == warehouseId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteAsync(int documentId, CancellationToken cancellationToken)
    {
        var entity = await _context.WarehouseDocuments
            .FirstOrDefaultAsync(d => d.DocumentId == documentId, cancellationToken);

        if (entity == null) return false;

        // Delete the physical file if it exists
        if (!string.IsNullOrEmpty(entity.DocumentUrl))
        {
            var filePath = entity.DocumentUrl.TrimStart('/');
            if (File.Exists(filePath))
                File.Delete(filePath);
        }

        _context.WarehouseDocuments.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}