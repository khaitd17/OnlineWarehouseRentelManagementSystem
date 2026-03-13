using System;
using System.Linq;
using WMS.Domain.Entities;
using BCrypt.Net;

namespace WMS.Infrastructure.Persistence
{
    public static class DatabaseSeeder
    {
        public static void Seed(ApplicationDbContext context)
        {
            // Global roles: only USER and ADMIN
            var roles = new[] {
                new Role { RoleName = "USER", Description = "Người dùng" },
                new Role { RoleName = "ADMIN", Description = "Quản trị viên" }
            };

            foreach (var role in roles)
            {
                if (!context.Roles.Any(r => r.RoleName == role.RoleName))
                {
                    context.Roles.Add(role);
                }
            }
            context.SaveChanges();

            // Get Role IDs
            var adminRoleId = context.Roles.First(r => r.RoleName == "ADMIN").RoleId;
            var userRoleId  = context.Roles.First(r => r.RoleName == "USER").RoleId;

            // default password
            string defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("123456");

            // Seed admin user
            var adminUser = context.Users.FirstOrDefault(u => u.Email == "admin@owrms.com");
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Email = "admin@owrms.com",
                    FullName = "Quản Trị Viên",
                    PasswordHash = defaultPasswordHash,
                    RoleId = adminRoleId,
                    Status = "ACTIVE",
                    Phone = "0123456780",
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(adminUser);
            }

            // Seed normal user (used as warehouse staff in memberships)
            var staffUser = context.Users.FirstOrDefault(u => u.Email == "user@owrms.com");
            if (staffUser == null)
            {
                staffUser = new User
                {
                    Email        = "user@owrms.com",
                    FullName     = "Nguyễn Văn A",
                    PasswordHash = defaultPasswordHash,
                    RoleId       = userRoleId,
                    Status       = "ACTIVE",
                    Phone        = "0123456781",
                    CreatedAt    = DateTime.UtcNow
                };
                context.Users.Add(staffUser);
            }

            // Seed warehouse owner — role hệ thống là USER, quyền trong kho qua WarehouseMembership
            var ownerUser = context.Users.FirstOrDefault(u => u.Email == "owner@owrms.com");
            if (ownerUser == null)
            {
                ownerUser = new User
                {
                    Email        = "owner@owrms.com",
                    FullName     = "Trần Văn B - Chủ Kho",
                    PasswordHash = defaultPasswordHash,
                    RoleId       = userRoleId,
                    Status       = "ACTIVE",
                    Phone        = "0123456782",
                    CreatedAt    = DateTime.UtcNow
                };
                context.Users.Add(ownerUser);
            }
            context.SaveChanges();

            // Add warehouse — owned by ownerUser (USER role, not admin)
            var warehouse = context.Warehouses.FirstOrDefault(w => w.Name == "Kho Hà Nội");
            if (warehouse == null)
            {
                warehouse = new Warehouse
                {
                    Name           = "Kho Hà Nội",
                    Address        = "123 Đường Giải Phóng, Hoàng Mai, Hà Nội",
                    OwnerId        = ownerUser.UserId,
                    TotalArea      = 5000,
                    AvailableArea  = 5000,
                    Status         = "APPROVED",
                    Description    = "Kho tổng phân phối khu vực Hà Nội",
                    Lat            = 20.9821,
                    Lng            = 105.8412,
                    OperatingHours = "08:00 - 18:00",
                    CreatedAt      = DateTime.UtcNow,
                    ApprovedAt     = DateTime.UtcNow,
                    ApprovedBy     = adminUser.UserId
                };
                context.Warehouses.Add(warehouse);
                context.SaveChanges();
            }

            var warehouse2 = context.Warehouses.FirstOrDefault(w => w.Name == "Kho Hải Phòng");
            if (warehouse2 == null)
            {
                warehouse2 = new Warehouse
                {
                    Name           = "Kho Hải Phòng",
                    Address        = "45 Đường Lạch Tray, Ngô Quyền, Hải Phòng",
                    OwnerId        = ownerUser.UserId,
                    TotalArea      = 3000,
                    AvailableArea  = 3000,
                    Status         = "APPROVED",
                    Description    = "Kho khu vực Hải Phòng",
                    Lat            = 20.8449,
                    Lng            = 106.6881,
                    OperatingHours = "07:00 - 17:00",
                    CreatedAt      = DateTime.UtcNow,
                    ApprovedAt     = DateTime.UtcNow,
                    ApprovedBy     = adminUser.UserId
                };
                context.Warehouses.Add(warehouse2);
                context.SaveChanges();
            }

            // Add Zones for warehouse 1
            if (!context.Zones.Any(z => z.WarehouseId == warehouse.WarehouseId))
            {
                var zoneA = new Zone { Code = "Z-A", Name = "Khu A - Thường",         WarehouseId = warehouse.WarehouseId, Description = "Khu vực lưu trữ hàng hóa chung", IsActive = true, CreatedAt = DateTime.UtcNow };
                var zoneB = new Zone { Code = "Z-B", Name = "Khu B - Lạnh",           WarehouseId = warehouse.WarehouseId, Description = "Khu vực lưu trữ hàng hóa lạnh", IsActive = true, CreatedAt = DateTime.UtcNow };
                var zoneC = new Zone { Code = "Z-C", Name = "Khu C - Hàng Nguy Hiểm", WarehouseId = warehouse.WarehouseId, Description = "Khu vực đặc biệt",                IsActive = true, CreatedAt = DateTime.UtcNow };
                context.Zones.AddRange(zoneA, zoneB, zoneC);
                context.SaveChanges();
            }

            // Add Zones for warehouse 2
            if (!context.Zones.Any(z => z.WarehouseId == warehouse2.WarehouseId))
            {
                var zone2A = new Zone { Code = "Z-A", Name = "Khu A", WarehouseId = warehouse2.WarehouseId, Description = "Khu A chung", IsActive = true, CreatedAt = DateTime.UtcNow };
                context.Zones.Add(zone2A);
                context.SaveChanges();
            }

            // Skills = bộ phận/phòng ban trong kho
            var skills = new[]
            {
                new Skill { Code = "INBOUND",   Name = "Nhận hàng" },
                new Skill { Code = "PUTAWAY",   Name = "Cất hàng vào vị trí" },
                new Skill { Code = "PICKING",   Name = "Lấy hàng" },
                new Skill { Code = "PACKING",   Name = "Đóng gói" },
                new Skill { Code = "OUTBOUND",  Name = "Xuất hàng" },
                new Skill { Code = "INVENTORY", Name = "Kiểm kê" },
                new Skill { Code = "FORKLIFT",  Name = "Vận hành xe nâng" }
            };

            foreach (var skill in skills)
            {
                if (!context.Skills.Any(s => s.Code == skill.Code))
                {
                    context.Skills.Add(skill);
                }
            }
            context.SaveChanges();

            // Add Task Types
            var taskTypes = new[]
            {
                new TaskType { Code = "INBOUND", Name = "Nhập kho" },
                new TaskType { Code = "OUTBOUND", Name = "Xuất kho" },
                new TaskType { Code = "AUDIT", Name = "Kiểm kê định kỳ" }
            };

            foreach (var tt in taskTypes)
            {
                if (!context.TaskTypes.Any(t => t.Code == tt.Code))
                {
                    context.TaskTypes.Add(tt);
                }
            }
            context.SaveChanges();

            // Warehouse Roles — truy vấn bằng Code, Name là text hiển thị
            var whRoles = new[]
            {
                new WarehouseRole { Code = "OWNER",    Name = "Chủ kho" },
                new WarehouseRole { Code = "MANAGER",  Name = "Quản lý kho" },
                new WarehouseRole { Code = "OPERATOR", Name = "Điều phối viên" },
                new WarehouseRole { Code = "STAFF",    Name = "Nhân viên" }
            };

            foreach (var wr in whRoles)
            {
                if (!context.WarehouseRoles.Any(w => w.Code == wr.Code))
                {
                    context.WarehouseRoles.Add(wr);
                }
            }
            context.SaveChanges();

            // Assign user@owrms.com — truy vấn role bằng Code
            var operatorWhRole = context.WarehouseRoles.First(r => r.Code == "OPERATOR");
            var staffWhRole    = context.WarehouseRoles.First(r => r.Code == "STAFF");
            var managerWhRole  = context.WarehouseRoles.First(r => r.Code == "MANAGER");
            var inboundSkill   = context.Skills.First(s => s.Code == "INBOUND");
            var forkliftSkill  = context.Skills.First(s => s.Code == "FORKLIFT");
            var zoneAEntity    = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-A");
            var zoneBEntity    = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-B");

            // ownerUser (owner@owrms.com) → OPERATOR membership cho warehouse 1
            // Đây là người có quyền điều phối toàn bộ kho (system role = USER, không phải ADMIN)
            var ownerMembership1 = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == ownerUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (ownerMembership1 == null)
            {
                ownerMembership1 = new WarehouseMembership
                {
                    UserId          = ownerUser.UserId,
                    WarehouseId     = warehouse.WarehouseId,
                    WarehouseRoleId = operatorWhRole.Id,
                    IsActive        = true,
                    IsAllSkill      = true,
                    IsAllZone       = true,
                    CreatedAt       = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(ownerMembership1);
                context.SaveChanges();
            }

            // ownerUser (owner@owrms.com) → OPERATOR membership cho warehouse 2
            var ownerMembership2 = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == ownerUser.UserId && m.WarehouseId == warehouse2.WarehouseId);
            if (ownerMembership2 == null)
            {
                ownerMembership2 = new WarehouseMembership
                {
                    UserId          = ownerUser.UserId,
                    WarehouseId     = warehouse2.WarehouseId,
                    WarehouseRoleId = operatorWhRole.Id,
                    IsActive        = true,
                    IsAllSkill      = true,
                    IsAllZone       = true,
                    CreatedAt       = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(ownerMembership2);
                context.SaveChanges();
            }

            // user@owrms.com → STAFF membership trong warehouse 1 (có skill cụ thể)
            var membership = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == staffUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (membership == null)
            {
                membership = new WarehouseMembership
                {
                    UserId          = staffUser.UserId,
                    WarehouseId     = warehouse.WarehouseId,
                    WarehouseRoleId = staffWhRole.Id,
                    IsActive        = true,
                    CreatedAt       = DateTime.UtcNow
                };
                membership.Skills.Add(inboundSkill);
                membership.Skills.Add(forkliftSkill);
                membership.Zones.Add(zoneAEntity);
                membership.Zones.Add(zoneBEntity);
                context.WarehouseMemberships.Add(membership);
                context.SaveChanges();
            }

            // user@owrms.com → MANAGER membership trong warehouse 2
            var membership2 = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == staffUser.UserId && m.WarehouseId == warehouse2.WarehouseId);
            if (membership2 == null)
            {
                membership2 = new WarehouseMembership
                {
                    UserId          = staffUser.UserId,
                    WarehouseId     = warehouse2.WarehouseId,
                    WarehouseRoleId = managerWhRole.Id,
                    IsActive        = true,
                    IsAllSkill      = true,
                    IsAllZone       = true,
                    CreatedAt       = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(membership2);
                context.SaveChanges();
            }
        }
    }
}
