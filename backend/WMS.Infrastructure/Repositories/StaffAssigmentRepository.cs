using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;

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
    }
}
