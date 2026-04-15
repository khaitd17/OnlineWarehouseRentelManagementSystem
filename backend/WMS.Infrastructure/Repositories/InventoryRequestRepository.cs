using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class InventoryRequestRepository : IInventoryRequestRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryRequestRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── OWNER VIEW ─────────────────────────────────────────────────────────
    public async Task<(List<InventoryRequest> Items, int TotalCount)> GetByOwnerIdAsync(
        int ownerId, string type, string? status, int? warehouseId,
        int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.InventoryRequests
            .Include(r => r.Renter)
            .Include(r => r.Warehouse)
            .Include(r => r.InventoryItems).ThenInclude(i => i.Asset)
            .Include(r => r.ConfirmedByNavigation)   // Manager đã duyệt
            .Include(r => r.AssignedStaff)            // Staff được giao việc
            .Where(r => r.Warehouse.OwnerId == ownerId && r.Type == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);
        if (warehouseId.HasValue)
            query = query.Where(r => r.WarehouseId == warehouseId.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    // ── RENTER VIEW ─────────────────────────────────────────────────────────
    public async Task<(List<InventoryRequest> Items, int TotalCount)> GetForRenterAsync(
        int renterId, string type, string? status,
        int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.InventoryRequests
            .Include(r => r.Warehouse)
            .Include(r => r.InventoryItems).ThenInclude(i => i.Asset)
            .Where(r => r.RenterId == renterId && r.Type == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    // ── STAFF / MANAGER / OPERATOR VIEW ─────────────────────────────────────
    // warehouseId BẮT BUỘC — không được phép query toàn hệ thống
    public async Task<(List<InventoryRequest> Items, int TotalCount)> GetForStaffAsync(
        string type, string? status, int? warehouseId,
        int page, int pageSize, CancellationToken cancellationToken)
    {
        if (!warehouseId.HasValue)
            throw new ArgumentException("warehouseId là bắt buộc khi truy vấn với vai trò vận hành kho.");

        var query = _context.InventoryRequests
            .Include(r => r.Renter)
            .Include(r => r.Warehouse)
            .Include(r => r.InventoryItems).ThenInclude(i => i.Asset)
            .Where(r => r.Type == type && r.WarehouseId == warehouseId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    // ── SINGLE ──────────────────────────────────────────────────────────────
    public async Task<InventoryRequest?> GetByIdAsync(int id, CancellationToken cancellationToken)
        => await _context.InventoryRequests
            .Include(r => r.Renter)
            .Include(r => r.Warehouse)
            .Include(r => r.InventoryItems).ThenInclude(i => i.Asset)
            .Include(r => r.ConfirmedByNavigation)
            .Include(r => r.AssignedStaff)
            .FirstOrDefaultAsync(r => r.InvReqId == id, cancellationToken);


    public async Task<List<InventoryRequest>> GetConfirmedByWarehouseAsync(
        int warehouseId, string? type, CancellationToken cancellationToken)
    {
        var query = _context.InventoryRequests
            .Include(r => r.Renter)
            .Include(r => r.Warehouse)
            .Include(r => r.InventoryItems).ThenInclude(i => i.Asset)
            .Where(r => r.WarehouseId == warehouseId && r.Status == "CONFIRMED");

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type.ToUpper());

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<InventoryRequest>> GetAssignedToStaffByWarehouseAsync(
        int staffId, int warehouseId, string? type, CancellationToken cancellationToken)
    {
        var query = _context.InventoryRequests
            .Include(r => r.Renter)
            .Include(r => r.Warehouse)
            .Include(r => r.InventoryItems).ThenInclude(i => i.Asset)
            .Where(r => r.WarehouseId == warehouseId
                     && r.Status == "ASSIGNED"
                     && r.AssignedStaffId == staffId);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(r => r.Type == type.ToUpper());

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }
    // ── CREATE ──────────────────────────────────────────────────────────────
    public async Task<InventoryRequest> CreateAsync(InventoryRequest request, CancellationToken cancellationToken)
    {
        request.CreatedAt = DateTime.Now;
        request.Status = "PENDING";
        _context.InventoryRequests.Add(request);
        await _context.SaveChangesAsync(cancellationToken);
        return request;
    }

    // ── UPDATE ──────────────────────────────────────────────────────────────
    public async Task UpdateAsync(InventoryRequest request, CancellationToken cancellationToken)
    {
        request.UpdatedAt = DateTime.Now;
        _context.InventoryRequests.Update(request);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    public async Task DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var req = await _context.InventoryRequests
            .Include(r => r.InventoryItems)
            .FirstOrDefaultAsync(r => r.InvReqId == id, cancellationToken)
            ?? throw new KeyNotFoundException($"InventoryRequest {id} not found.");

        if (req.Status != "PENDING")
            throw new InvalidOperationException("Only PENDING requests can be deleted.");

        _context.InventoryItems.RemoveRange(req.InventoryItems);
        _context.InventoryRequests.Remove(req);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
