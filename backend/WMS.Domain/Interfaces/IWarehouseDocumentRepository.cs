using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseDocumentRepository
{
    Task AddAsync(
        int warehouseId,
        string documentType,
        string documentUrl,
        CancellationToken cancellationToken);
}