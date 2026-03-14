using MediatR;

namespace WMS.Application.Features.Staff.CreateStaff
{
    public class CreateStaffCommand : IRequest<int>
    {
        // Caller (set từ JWT trong Controller)
        public int CallerId { get; set; }

        // User info của nhân viên mới
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Phone { get; set; }

        // Warehouse
        public int WarehouseId { get; set; }

        // Role muốn gán cho nhân viên mới trong kho ("MANAGER" hoặc "STAFF")
        public string TargetRoleCode { get; set; } = default!;

        // Skills & Zones được gán (dùng khi TargetRoleCode là STAFF hoặc MANAGER)
        public List<int> SkillIds { get; set; } = new();
        public List<int> ZoneIds { get; set; } = new();

        // Chỉ OPERATOR được set true — phụ trách tất cả skill/zone
        public bool IsAllSkill { get; set; } = false;
        public bool IsAllZone { get; set; } = false;
    }
}
