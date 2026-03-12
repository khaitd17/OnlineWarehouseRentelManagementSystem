using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Persistence.ScaffoldModels
{
    public class TaskAssignment
    {
        public int Id { get; set; }

        public int TaskId { get; set; }

        public int MembershipId { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        public string Status { get; set; } = "Assigned";

        public WarehouseTask WarehouseTask { get; set; } = null!;

        public WarehouseMembership Membership { get; set; } = null!;
    }
}
