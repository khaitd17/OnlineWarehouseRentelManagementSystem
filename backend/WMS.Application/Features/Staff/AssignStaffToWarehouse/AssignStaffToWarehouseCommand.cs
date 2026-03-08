using MediatR;

namespace WMS.Application.Features.Staff.AssignStaffToWarehouse
{
    public class AssignStaffToWarehouseCommand : IRequest<int>
    {
        public int StaffId { get; set; }
        public int WarehouseId { get; set; }
        public int OwnerId { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string? Notes { get; set; }

        public AssignStaffToWarehouseCommand(
            int staffId,
            int warehouseId,
            int ownerId,
            DateOnly? startDate = null,
            DateOnly? endDate = null,
            string? notes = null)
        {
            StaffId = staffId;
            WarehouseId = warehouseId;
            OwnerId = ownerId;
            StartDate = startDate;
            EndDate = endDate;
            Notes = notes;
        }
    }
}
