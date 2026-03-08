using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;
using Microsoft.EntityFrameworkCore;

namespace WMS.Infrastructure.Repositories
{
    public class StaffAssigmentRepository : IStaffAssigmentRepository
    {
        private readonly ApplicationDbContext _context;

        public StaffAssigmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WMS.Domain.Entities.StaffAssignment> AddAsync(WMS.Domain.Entities.StaffAssignment assignment, CancellationToken tk)
        {
            // Map from Domain entity to Scaffold model
            var scaffoldAssignment = new WMS.Infrastructure.Persistence.ScaffoldModels.StaffAssignment
            {
                StaffId = assignment.StaffId,
                WarehouseId = assignment.WarehouseId,
                Status = assignment.Status,
                AssignedAt = assignment.AssignedAt,
                EndDate = assignment.EndDate,
                Notes = assignment.Notes
            };

            _context.StaffAssignments.Add(scaffoldAssignment);
            await _context.SaveChangesAsync(tk);

            // Map back to Domain entity
            assignment.AssignmentId = scaffoldAssignment.AssignmentId;
            return assignment;
        }

        public async Task<List<StaffAssignmentDto>> GetStaffByWarehouseIdAsync(int warehouseId, int pageNumber, int pageSize, CancellationToken tk = default)
        {
            var result = await _context.StaffAssignments
                .Where(sa => sa.WarehouseId == warehouseId)
                .OrderByDescending(sa => sa.AssignedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Join(
                    _context.Users,
                    sa => sa.StaffId,
                    user => user.UserId,
                    (sa, user) => new StaffAssignmentDto(
                        sa.AssignmentId,
                        sa.StaffId,
                        sa.WarehouseId,
                        user.FullName,
                        user.Email,
                        user.Phone,
                        sa.Status,
                        sa.AssignedAt.HasValue
                            ? DateOnly.FromDateTime(sa.AssignedAt.Value)
                            : null,
                        sa.EndDate,
                        sa.Notes
                    )
                )
                .ToListAsync(tk);

            return result;
        }

        public async Task<List<StaffAssignmentDto>> GetStaffByOwnerIdAsync(int ownerId, int pageNumber, int pageSize, CancellationToken tk = default)
        {
            var result = await _context.StaffAssignments
    .Where(sa => sa.Warehouse.OwnerId == ownerId)
    .OrderByDescending(sa => sa.AssignedAt)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .Select(sa => new StaffAssignmentDto(
        sa.AssignmentId,
        sa.StaffId,
        sa.WarehouseId,
        sa.Staff.FullName,
        sa.Staff.Email,
        sa.Staff.Phone,
        sa.Status,
        sa.AssignedAt.HasValue
            ? DateOnly.FromDateTime(sa.AssignedAt.Value)
            : null,
        sa.EndDate,
        sa.Notes
    ))
    .ToListAsync(tk);

            return result;
        }

        public async Task<int> GetTotalCountByWarehouseIdAsync(int warehouseId, CancellationToken tk = default)
        {
            return await _context.StaffAssignments
                .Where(sa => sa.WarehouseId == warehouseId)
                .CountAsync(tk);
        }

        public async Task<int> GetTotalCountByOwnerIdAsync(int ownerId, CancellationToken tk = default)
        {
            return await _context.StaffAssignments
                .Join(
                    _context.Warehouses,
                    sa => sa.WarehouseId,
                    w => w.WarehouseId,
                    (sa, w) => new { sa, w }
                )
                .Where(x => x.w.OwnerId == ownerId)
                .CountAsync(tk);
        }
    }
}
