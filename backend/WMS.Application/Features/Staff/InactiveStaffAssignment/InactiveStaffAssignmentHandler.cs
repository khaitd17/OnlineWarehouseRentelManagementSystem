using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.InactiveStaffAssignment
{
    public class InactiveStaffAssignmentHandler : IRequestHandler<InactiveStaffAssignmentCommand, bool>
    {
        private readonly IStaffAssigmentRepository _staffAssignmentRepository;
        private readonly IWarehouseRepository _warehouseRepository;

        public InactiveStaffAssignmentHandler(
            IStaffAssigmentRepository staffAssignmentRepository,
            IWarehouseRepository warehouseRepository)
        {
            _staffAssignmentRepository = staffAssignmentRepository;
            _warehouseRepository = warehouseRepository;
        }

        // [COMMENTED OUT - Database schema changes in progress]
        // Staff assignment deactivation is temporarily disabled
        public async Task<bool> Handle(
            InactiveStaffAssignmentCommand request,
            CancellationToken cancellationToken)
        {
            throw new NotImplementedException("Staff assignment deactivation is currently disabled. Database changes are in progress.");
            
            // // If WarehouseId is provided, check authorization
            // if (request.WarehouseId.HasValue)
            // {
            //     var warehouseOwnerId = await _warehouseRepository.FindWarehouseOwnerById(
            //         request.WarehouseId.Value, cancellationToken);

            //     if (warehouseOwnerId == null)
            //         throw new Exception($"Warehouse with id {request.WarehouseId} not found");

            //     // Check if current user is the owner of the warehouse
            //     if (warehouseOwnerId.Value != request.OwnerId)
            //         throw new Exception($"User {request.OwnerId} is not the owner of warehouse {request.WarehouseId}");
            // }

            // // Get current date as endDate
            // var endDate = DateOnly.FromDateTime(DateTime.UtcNow);

            // // Inactive staff assignments
            // var result = await _staffAssignmentRepository.InactiveStaffAssignmentsByStaffIdAsync(
            //     request.StaffId, request.WarehouseId, endDate, cancellationToken);

            // return result;
        }
    }
}
