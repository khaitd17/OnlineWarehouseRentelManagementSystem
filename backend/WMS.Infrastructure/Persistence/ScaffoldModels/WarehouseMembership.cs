using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WMS.Infrastructure.Persistence.ScaffoldModels
{
    public class WarehouseMembership
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int WarehouseId { get; set; }

        public int WarehouseRoleId { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;

        public Warehouse Warehouse { get; set; } = null!;

        public WarehouseRole Role { get; set; } = null!;

        public ICollection<Skill> Skills { get; set; } = new List<Skill>();

        public ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();
    }
}
