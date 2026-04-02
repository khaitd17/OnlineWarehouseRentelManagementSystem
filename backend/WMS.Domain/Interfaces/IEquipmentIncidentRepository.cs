using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IEquipmentIncidentRepository
{
    Task<EquipmentIncident?> GetByIdAsync(int id, CancellationToken ct);
    Task<List<EquipmentIncident>> GetByWarehouseIdAsync(int warehouseId, string? status, CancellationToken ct);
    Task<List<EquipmentIncident>> GetByEquipmentIdAsync(int equipmentId, CancellationToken ct);
    Task<int> CreateAsync(EquipmentIncident incident, CancellationToken ct);
    Task UpdateAsync(EquipmentIncident incident, CancellationToken ct);
    Task AddCommentAsync(EquipmentIncidentComment comment, CancellationToken ct);
    Task AddAttachmentAsync(EquipmentIncidentAttachment attachment, CancellationToken ct);
    Task<List<EquipmentIncidentComment>> GetCommentsAsync(int incidentId, CancellationToken ct);
}
