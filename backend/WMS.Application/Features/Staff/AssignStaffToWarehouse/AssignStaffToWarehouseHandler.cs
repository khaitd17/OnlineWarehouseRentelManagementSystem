using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.AssignStaffToWarehouse
{
    public class AssignStaffToWarehouseHandler : IRequestHandler<AssignStaffToWarehouseCommand, int>
    {
        private readonly IStaffAssigmentRepository _staffAssignmentRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly IUserRepository _userRepository;

        public AssignStaffToWarehouseHandler(
            IStaffAssigmentRepository staffAssignmentRepository,
            IWarehouseRepository warehouseRepository,
            IUserRepository userRepository)
        {
            _staffAssignmentRepository = staffAssignmentRepository;
            _warehouseRepository = warehouseRepository;
            _userRepository = userRepository;
        }

        // [COMMENTED OUT - Database schema changes in progress]
        // Staff assignment functionality is temporarily disabled to avoid conflicts with database modifications
        public async Task<int> Handle(
            AssignStaffToWarehouseCommand request,
            CancellationToken cancellationToken)
        {
            throw new NotImplementedException("Staff assignment functionality is currently disabled. Database changes are in progress.");
            
            // // Check warehouse exists
            // var warehouseOwnerId = await _warehouseRepository.FindWarehouseOwnerById(
            //     request.WarehouseId, cancellationToken);

            // if (warehouseOwnerId == null)
            //     throw new Exception($"Warehouse with id {request.WarehouseId} not found");

            // // Check current user is warehouse owner
            // if (warehouseOwnerId.Value != request.OwnerId)
            //     throw new Exception($"User {request.OwnerId} is not the owner of warehouse {request.WarehouseId}");

            // // Check staff exists
            // var staff = await _userRepository.GetByIdAsync(request.StaffId, cancellationToken);
            // if (staff == null)
            //     throw new Exception($"Staff with id {request.StaffId} not found");

            // // Check if staff is active
            // if (staff.Status != "ACTIVE")
            //     throw new Exception($"Staff is not active. Current status: {staff.Status}");

            // // Get all active assignments for this staff and set their endDate to today
            // var allActiveAssignments = await _staffAssignmentRepository.GetAllActiveAssignmentsByStaffIdAsync(
            //     request.StaffId, cancellationToken);

            // var endDateToday = DateOnly.FromDateTime(DateTime.UtcNow);
            // foreach (var assignment in allActiveAssignments)
            // {
            //     // Close all active assignments (to any warehouse)
            //     await _staffAssignmentRepository.UpdateStaffAssignmentAsync(
            //         assignment.AssignmentId,
            //         endDateToday,
            //         "INACTIVE",
            //         cancellationToken);
            // }

            // // Create new staff assignment
            // var newAssignment = new StaffAssignment(
            //     staffId: request.StaffId,
            //     warehouseId: request.WarehouseId,
            //     status: "ACTIVE",
            //     assignedAt: request.StartDate != null
            //         ? request.StartDate.Value.ToDateTime(TimeOnly.MinValue)
            //         : DateTime.Now,
            //     endDate: request.EndDate,
            //     notes: request.Notes
            // );

            // var result = await _staffAssignmentRepository.AddAsync(newAssignment, cancellationToken);
            // return result.AssignmentId;
        }
    }
}
