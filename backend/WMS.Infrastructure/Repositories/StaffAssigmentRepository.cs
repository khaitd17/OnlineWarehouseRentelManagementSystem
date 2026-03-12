using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

using Microsoft.EntityFrameworkCore;

namespace WMS.Infrastructure.Repositories
{
    public class StaffAssigmentRepository : IStaffAssigmentRepository
    {
        //private readonly ApplicationDbContext _context;

        //public StaffAssigmentRepository(ApplicationDbContext context)
        //{
        //    _context = context;
        //}

        //public async Task<WMS.Domain.Entities.StaffAssignment> AddAsync(WMS.Domain.Entities.StaffAssignment assignment, CancellationToken tk)
        //{
        //    // Map from Domain entity to Scaffold model
        //    var scaffoldAssignment = new WMS.Infrastructure.Persistence.ScaffoldModels.StaffAssignment
        //    {
        //        StaffId = assignment.StaffId,
        //        WarehouseId = assignment.WarehouseId,
        //        Status = assignment.Status,
        //        AssignedAt = assignment.AssignedAt,
        //        EndDate = assignment.EndDate,
        //        Notes = assignment.Notes
        //    };

        //    _context.StaffAssignments.Add(scaffoldAssignment);
        //    await _context.SaveChangesAsync(tk);

        //    // Map back to Domain entity
        //    assignment.AssignmentId = scaffoldAssignment.AssignmentId;
        //    return assignment;
        //}

        //public async Task<List<StaffAssignmentDto>> GetStaffByWarehouseIdAsync(int warehouseId, CancellationToken tk = default)
        //{
        //    var result = await _context.StaffAssignments
        //        .Where(sa => sa.WarehouseId == warehouseId)
        //        .Join(
        //            _context.Users,
        //            sa => sa.StaffId,
        //            user => user.UserId,
        //            (sa, user) => new { sa, user }
        //        )
        //        .OrderByDescending(x => x.sa.AssignedAt)
        //        .ToListAsync(tk);

        //    // Map to DTO after data retrieval
        //    return result.Select(x => new StaffAssignmentDto(
        //        x.sa.AssignmentId,
        //        x.sa.StaffId,
        //        x.sa.WarehouseId,
        //        x.user.FullName,
        //        x.user.Email,
        //        x.user.Phone,
        //        x.sa.Status,
        //        x.sa.AssignedAt.HasValue
        //            ? DateOnly.FromDateTime(x.sa.AssignedAt.Value)
        //            : null,
        //        x.sa.EndDate,
        //        x.sa.Notes
        //    )).ToList();
        //}

        //public async Task<List<StaffAssignmentDto>> GetStaffByOwnerIdAsync(int ownerId, CancellationToken tk = default)
        //{
        //    var result = await _context.StaffAssignments
        //        .Include(sa => sa.Staff)
        //        .Include(sa => sa.Warehouse)
        //        .Where(sa => sa.Warehouse.OwnerId == ownerId)
        //        .OrderByDescending(sa => sa.AssignedAt)
        //        .ToListAsync(tk);

        //    // Map to DTO after data retrieval
        //    return result.Select(sa => new StaffAssignmentDto(
        //        sa.AssignmentId,
        //        sa.StaffId,
        //        sa.WarehouseId,
        //        sa.Staff.FullName,
        //        sa.Staff.Email,
        //        sa.Staff.Phone,
        //        sa.Status,
        //        sa.AssignedAt.HasValue
        //            ? DateOnly.FromDateTime(sa.AssignedAt.Value)
        //            : null,
        //        sa.EndDate,
        //        sa.Notes
        //    )).ToList();
        //}

        //public async Task<int> GetTotalCountByWarehouseIdAsync(int warehouseId, CancellationToken tk = default)
        //{
        //    return await _context.StaffAssignments
        //        .Where(sa => sa.WarehouseId == warehouseId)
        //        .CountAsync(tk);
        //}

        //public async Task<int> GetTotalCountByOwnerIdAsync(int ownerId, CancellationToken tk = default)
        //{
        //    return await _context.StaffAssignments
        //        .Join(
        //            _context.Warehouses,
        //            sa => sa.WarehouseId,
        //            w => w.WarehouseId,
        //            (sa, w) => new { sa, w }
        //        )
        //        .Where(x => x.w.OwnerId == ownerId)
        //        .CountAsync(tk);
        //}

        //public async Task<List<StaffAssignmentDto>> SearchStaffByWarehouseIdAsync(int warehouseId, string searchKeyword, CancellationToken tk = default)
        //{
        //    var result = await _context.StaffAssignments
        //        .Where(sa => sa.WarehouseId == warehouseId &&
        //            (sa.Staff.FullName.Contains(searchKeyword) ||
        //             sa.Staff.Email.Contains(searchKeyword)))
        //        .OrderByDescending(sa => sa.AssignedAt)
        //        .Join(
        //            _context.Users,
        //            sa => sa.StaffId,
        //            user => user.UserId,
        //            (sa, user) => new { sa, user }
        //        )
        //        .ToListAsync(tk);

        //    // Map to DTO after data retrieval
        //    return result.Select(x => new StaffAssignmentDto(
        //        x.sa.AssignmentId,
        //        x.sa.StaffId,
        //        x.sa.WarehouseId,
        //        x.user.FullName,
        //        x.user.Email,
        //        x.user.Phone,
        //        x.sa.Status,
        //        x.sa.AssignedAt.HasValue
        //            ? DateOnly.FromDateTime(x.sa.AssignedAt.Value)
        //            : null,
        //        x.sa.EndDate,
        //        x.sa.Notes
        //    )).ToList();
        //}

        //public async Task<List<StaffAssignmentDto>> SearchStaffByOwnerIdAsync(int ownerId, string searchKeyword, CancellationToken tk = default)
        //{
        //    var result = await _context.StaffAssignments
        //        .Where(sa => sa.Warehouse.OwnerId == ownerId && (sa.Staff.FullName.Contains(searchKeyword) || sa.Staff.Email.Contains(searchKeyword)))
        //        .OrderByDescending(sa => sa.AssignedAt)
        //        .ToListAsync(tk);

        //    // Map to DTO after data retrieval
        //    return result.Select(sa => new StaffAssignmentDto(
        //        sa.AssignmentId,
        //        sa.StaffId,
        //        sa.WarehouseId,
        //        sa.Staff.FullName,
        //        sa.Staff.Email,
        //        sa.Staff.Phone,
        //        sa.Status,
        //        sa.AssignedAt.HasValue
        //            ? DateOnly.FromDateTime(sa.AssignedAt.Value)
        //            : null,
        //        sa.EndDate,
        //        sa.Notes
        //    )).ToList();
        //}

        //public async Task<int> GetTotalCountByWarehouseIdAndKeywordAsync(int warehouseId, string searchKeyword, CancellationToken tk = default)
        //{
        //    return await _context.StaffAssignments
        //        .Where(sa => sa.WarehouseId == warehouseId && (sa.Staff.FullName.Contains(searchKeyword) || sa.Staff.Email.Contains(searchKeyword)))
        //        .CountAsync(tk);
        //}

        //public async Task<int> GetTotalCountByOwnerIdAndKeywordAsync(int ownerId, string searchKeyword, CancellationToken tk = default)
        //{
        //    return await _context.StaffAssignments
        //        .Join(
        //            _context.Warehouses,
        //            sa => sa.WarehouseId,
        //            w => w.WarehouseId,
        //            (sa, w) => new { sa, w }
        //        )
        //        .Where(x => x.w.OwnerId == ownerId && (x.sa.Staff.FullName.Contains(searchKeyword) || x.sa.Staff.Email.Contains(searchKeyword)))
        //        .CountAsync(tk);
        //}

        //public async Task<bool> UpdateStaffAssignmentAsync(int assignmentId, DateOnly? endDate, string status, CancellationToken tk = default)
        //{
        //    var assignment = await _context.StaffAssignments.FindAsync(new object[] { assignmentId }, cancellationToken: tk);
        //    if (assignment == null)
        //        return false;

        //    assignment.EndDate = endDate;
        //    assignment.Status = status;
        //    await _context.SaveChangesAsync(tk);
        //    return true;
        //}

        //public async Task<bool> InactiveStaffAssignmentsByStaffIdAsync(int staffId, int? warehouseId, DateOnly? endDate, CancellationToken tk = default)
        //{
        //    var query = _context.StaffAssignments.Where(sa => sa.StaffId == staffId);

        //    if (warehouseId.HasValue)
        //    {
        //        query = query.Where(sa => sa.WarehouseId == warehouseId.Value);
        //    }

        //    var assignments = await query.ToListAsync(tk);

        //    foreach (var assignment in assignments)
        //    {
        //        assignment.Status = "INACTIVE";
        //        assignment.EndDate = endDate;
        //    }

        //    await _context.SaveChangesAsync(tk);
        //    return true;
        //}

        //public async Task<WMS.Domain.Entities.StaffAssignment?> GetActiveAssignmentAsync(int staffId, int warehouseId, CancellationToken tk = default)
        //{
        //    var assignment = await _context.StaffAssignments
        //        .FirstOrDefaultAsync(sa => sa.StaffId == staffId && 
        //                                  sa.WarehouseId == warehouseId && 
        //                                  sa.Status == "ACTIVE", tk);
            
        //    if (assignment == null)
        //        return null;

        //    // Map from scaffold model to domain entity
        //    return new WMS.Domain.Entities.StaffAssignment(
        //        staffId: assignment.StaffId,
        //        warehouseId: assignment.WarehouseId,
        //        status: assignment.Status,
        //        assignedAt: assignment.AssignedAt ?? DateTime.Now,
        //        endDate: assignment.EndDate,
        //        notes: assignment.Notes
        //    );
        //}

        //public async Task<List<WMS.Domain.Entities.StaffAssignment>> GetAllActiveAssignmentsByStaffIdAsync(int staffId, CancellationToken tk = default)
        //{
        //    var assignments = await _context.StaffAssignments
        //        .Where(sa => sa.StaffId == staffId && sa.Status == "ACTIVE")
        //        .ToListAsync(tk);
            
        //    // Map from scaffold models to domain entities
        //    return assignments.Select(assignment => new WMS.Domain.Entities.StaffAssignment(
        //        staffId: assignment.StaffId,
        //        warehouseId: assignment.WarehouseId,
        //        status: assignment.Status,
        //        assignedAt: assignment.AssignedAt ?? DateTime.Now,
        //        endDate: assignment.EndDate,
        //        notes: assignment.Notes
        //    )
        //    {
        //        AssignmentId = assignment.AssignmentId
        //    }).ToList();
        //}
    }
}

