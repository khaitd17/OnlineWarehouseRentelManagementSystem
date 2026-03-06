using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WMS.Application.Features.Staff.CreateStaff
{
    public class CreateStaffCommand : IRequest<int>
    {
        // User info
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Phone { get; set; }

        // Assignment
        public int WarehouseId { get; set; }
        public int OwnerId { get; set; }

        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string? Notes { get; set; }
    }
}
