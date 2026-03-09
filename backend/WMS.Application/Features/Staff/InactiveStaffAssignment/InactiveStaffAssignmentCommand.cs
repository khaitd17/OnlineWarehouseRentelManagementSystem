using MediatR;

namespace WMS.Application.Features.Staff.InactiveStaffAssignment
{
    public class InactiveStaffAssignmentCommand : IRequest<bool>
    {
        public int StaffId { get; set; }
        public int OwnerId { get; set; }
        public int? WarehouseId { get; set; }

        public InactiveStaffAssignmentCommand(int staffId, int ownerId, int? warehouseId = null)
        {
            StaffId = staffId;
            OwnerId = ownerId;
            WarehouseId = warehouseId;
        }
    }
}
