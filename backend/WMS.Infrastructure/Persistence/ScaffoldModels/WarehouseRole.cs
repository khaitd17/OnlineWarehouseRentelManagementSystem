using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WMS.Infrastructure.Persistence.ScaffoldModels
{
    public partial class WarehouseRole
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public ICollection<WarehouseMembership> Memberships { get; set; } = new List<WarehouseMembership>();
    }
}
