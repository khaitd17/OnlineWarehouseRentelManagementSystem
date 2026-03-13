using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WMS.Infrastructure.Persistence.ScaffoldModels
{
    public class TaskType
    {
        public int Id { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public ICollection<Skill> RequiredSkills { get; set; } = new List<Skill>();

        public ICollection<Task> Tasks { get; set; } = new List<Task>();
    }
}
