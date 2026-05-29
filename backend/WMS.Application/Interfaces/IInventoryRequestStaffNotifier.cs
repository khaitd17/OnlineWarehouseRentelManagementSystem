using WMS.Domain.Entities;

namespace WMS.Application.Interfaces;

public interface IInventoryRequestStaffNotifier
{
    Task NotifyReadyForProcessingAsync(
        InventoryRequest request,
        CancellationToken cancellationToken = default);
}
