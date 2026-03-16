using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class EquipmentRepository : IEquipmentRepository
{
    private readonly ApplicationDbContext _context;

    public EquipmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Equipment?> GetByIdAsync(int equipmentId, CancellationToken cancellationToken)
    {
        return await _context.Equipments
            .FirstOrDefaultAsync(x => x.EquipmentId == equipmentId, cancellationToken);
    }

    public async Task<List<Equipment>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken)
    {
        return await _context.Equipments
            .Where(x => x.WarehouseId == warehouseId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CreateAsync(Equipment equipment, CancellationToken cancellationToken)
    {
        equipment.CreatedAt = DateTime.UtcNow;
        _context.Equipments.Add(equipment);
        await _context.SaveChangesAsync(cancellationToken);
        return equipment.EquipmentId;
    }

    public async Task UpdateAsync(Equipment equipment, CancellationToken cancellationToken)
    {
        var existing = await _context.Equipments
            .FirstOrDefaultAsync(x => x.EquipmentId == equipment.EquipmentId, cancellationToken);

        if (existing != null)
        {
            existing.Name = equipment.Name;
            existing.Type = equipment.Type;
            existing.Location = equipment.Location;
            existing.Description = equipment.Description;
            existing.Specifications = equipment.Specifications;
            existing.Status = equipment.Status;
            existing.IotDeviceId = equipment.IotDeviceId;
            existing.PurchaseDate = equipment.PurchaseDate;
            existing.LastMaintenanceDate = equipment.LastMaintenanceDate;
            existing.NextMaintenanceDate = equipment.NextMaintenanceDate;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task DeleteAsync(int equipmentId, CancellationToken cancellationToken)
    {
        var existing = await _context.Equipments
            .FirstOrDefaultAsync(x => x.EquipmentId == equipmentId, cancellationToken);

        if (existing != null)
        {
            _context.Equipments.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task UpdateStatusAsync(int equipmentId, string status, CancellationToken cancellationToken)
    {
        var existing = await _context.Equipments
            .FirstOrDefaultAsync(x => x.EquipmentId == equipmentId, cancellationToken);

        if (existing != null)
        {
            existing.Status = status;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<Equipment>> GetByOwnerIdAsync(int ownerId, CancellationToken cancellationToken)
    {
        return await _context.Equipments
            .Include(e => e.Warehouse)
            .Where(e => e.Warehouse != null && e.Warehouse.OwnerId == ownerId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
