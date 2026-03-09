using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;

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
}