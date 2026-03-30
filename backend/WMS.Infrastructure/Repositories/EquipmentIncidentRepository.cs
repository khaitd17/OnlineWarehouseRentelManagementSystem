using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class EquipmentIncidentRepository : IEquipmentIncidentRepository
{
    private readonly ApplicationDbContext _db;

    public EquipmentIncidentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<EquipmentIncident?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _db.EquipmentIncidents
            .Include(i => i.Equipment)
            .Include(i => i.ReportedBy)
            .Include(i => i.Attachments)
            .FirstOrDefaultAsync(i => i.Id == id, ct);
    }

    public async Task<List<EquipmentIncident>> GetByWarehouseIdAsync(int warehouseId, string? status, CancellationToken ct)
    {
        var query = _db.EquipmentIncidents
            .Include(i => i.Equipment)
            .Include(i => i.ReportedBy)
            .Where(i => i.WarehouseId == warehouseId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(i => i.Status == status);
        }

        return await query.OrderByDescending(i => i.CreatedAt).ToListAsync(ct);
    }

    public async Task<List<EquipmentIncident>> GetByEquipmentIdAsync(int equipmentId, CancellationToken ct)
    {
        return await _db.EquipmentIncidents
            .Include(i => i.ReportedBy)
            .Where(i => i.EquipmentId == equipmentId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<int> CreateAsync(EquipmentIncident incident, CancellationToken ct)
    {
        _db.EquipmentIncidents.Add(incident);
        await _db.SaveChangesAsync(ct);
        return incident.Id;
    }

    public async Task UpdateAsync(EquipmentIncident incident, CancellationToken ct)
    {
        _db.EquipmentIncidents.Update(incident);
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddCommentAsync(EquipmentIncidentComment comment, CancellationToken ct)
    {
        _db.EquipmentIncidentComments.Add(comment);
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddAttachmentAsync(EquipmentIncidentAttachment attachment, CancellationToken ct)
    {
        _db.EquipmentIncidentAttachments.Add(attachment);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<EquipmentIncidentComment>> GetCommentsAsync(int incidentId, CancellationToken ct)
    {
        return await _db.EquipmentIncidentComments
            .Include(c => c.User)
            .Where(c => c.IncidentId == incidentId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);
    }
}
