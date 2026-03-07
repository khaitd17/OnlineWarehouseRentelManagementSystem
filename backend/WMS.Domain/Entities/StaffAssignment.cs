using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WMS.Domain.Entities
{
    public class StaffAssignment
    {
        public int AssignmentId { get; set; }

        public int StaffId { get; set; }

        public int WarehouseId { get; set; }

        public string? Status { get; set; }

        public DateTime AssignedAt { get; set; }

        public DateOnly? EndDate { get; set; }

        public string? Notes { get; set; }

        public StaffAssignment(
    int staffId,
    int warehouseId,
    string status,
    DateTime assignedAt,
    DateOnly? endDate,
    string? notes)
        {
            StaffId = staffId;
            WarehouseId = warehouseId;
            Status = status;
            AssignedAt = assignedAt;
            EndDate = endDate;
            Notes = notes;
        }
    }
}
