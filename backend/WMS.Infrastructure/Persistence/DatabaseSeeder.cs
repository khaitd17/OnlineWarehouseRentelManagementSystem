using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
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
            var staffUser = context.Users.FirstOrDefault(u => u.Email == "trandinhkhai09072003@gmail.com");
            if (staffUser == null)
            {
                staffUser = new User
                {
                    Email        = "trandinhkhai09072003@gmail.com",
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
                    ApprovedBy     = adminUser.UserId,
                    HasZone        = true
                };
                context.Warehouses.Add(warehouse);
                context.SaveChanges();
            }
            else if (!warehouse.HasZone)
            {
                warehouse.HasZone = true;
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
                    ApprovedBy     = adminUser.UserId,
                    HasZone        = true
                };
                context.Warehouses.Add(warehouse2);
                context.SaveChanges();
            }
            else if (!warehouse2.HasZone)
            {
                warehouse2.HasZone = true;
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

            // Add Zones for warehouse 2 — Hải Phòng
            if (!context.Zones.Any(z => z.WarehouseId == warehouse2.WarehouseId))
            {
                var zone2A = new Zone { Code = "Z-A", Name = "Khu A - Cảng",      WarehouseId = warehouse2.WarehouseId, Description = "Khu tiếp nhận container từ cảng",  IsActive = true, CreatedAt = DateTime.UtcNow };
                var zone2B = new Zone { Code = "Z-B", Name = "Khu B - Khô",       WarehouseId = warehouse2.WarehouseId, Description = "Khu lưu trữ hàng hóa khô",          IsActive = true, CreatedAt = DateTime.UtcNow };
                var zone2C = new Zone { Code = "Z-C", Name = "Khu C - Lạnh",      WarehouseId = warehouse2.WarehouseId, Description = "Khu lưu trữ hàng đông lạnh",         IsActive = true, CreatedAt = DateTime.UtcNow };
                var zone2D = new Zone { Code = "Z-D", Name = "Khu D - Xuất khẩu", WarehouseId = warehouse2.WarehouseId, Description = "Khu tập kết hàng chờ xuất khẩu",    IsActive = true, CreatedAt = DateTime.UtcNow };
                context.Zones.AddRange(zone2A, zone2B, zone2C, zone2D);
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
            var taskTypeData = new[]
            {
                new { Code = "INBOUND",       Name = "Nhập kho",           Description = "Tiếp nhận hàng hoá vào kho",               IsAllSkill = false },
                new { Code = "OUTBOUND",      Name = "Xuất kho",           Description = "Xuất hàng hoá ra khỏi kho",                IsAllSkill = false },
                new { Code = "AUDIT",         Name = "Kiểm kê định kỳ",    Description = "Đếm và đối chiếu tồn kho",                 IsAllSkill = false },
                new { Code = "EQUIP_MAINT",   Name = "Bảo trì thiết bị",   Description = "Bảo dưỡng và sửa chữa thiết bị kho",      IsAllSkill = false },
                new { Code = "GENERAL_CLEAN", Name = "Vệ sinh kho",        Description = "Vệ sinh toàn bộ hoặc khu vực kho",         IsAllSkill = true  },
                new { Code = "ZONE_INSPECT",  Name = "Kiểm tra khu vực",   Description = "Tuần tra và kiểm tra tình trạng zone",     IsAllSkill = true  },
                new { Code = "OTHER",         Name = "Khác",               Description = "Task tổng quát, không yêu cầu skill cụ thể", IsAllSkill = true  },
            };

            foreach (var tt in taskTypeData)
            {
                if (!context.TaskTypes.Any(t => t.Code == tt.Code))
                {
                    context.TaskTypes.Add(new TaskType
                    {
                        Code        = tt.Code,
                        Name        = tt.Name,
                        Description = tt.Description,
                        IsAllSkill  = tt.IsAllSkill,
                    });
                }
            }
            context.SaveChanges();

            var skInbound   = context.Skills.FirstOrDefault(s => s.Code == "INBOUND");
            var skOutbound  = context.Skills.FirstOrDefault(s => s.Code == "OUTBOUND");
            var skInventory = context.Skills.FirstOrDefault(s => s.Code == "INVENTORY");
            var skForklift  = context.Skills.FirstOrDefault(s => s.Code == "FORKLIFT");

            var ttInbound  = context.TaskTypes.First(t => t.Code == "INBOUND");
            var ttOutbound = context.TaskTypes.First(t => t.Code == "OUTBOUND");
            var ttAudit    = context.TaskTypes.First(t => t.Code == "AUDIT");
            var ttEquip    = context.TaskTypes.First(t => t.Code == "EQUIP_MAINT");

            if (ttInbound.SkillId  == null) { ttInbound.SkillId  = skInbound?.Id; }
            if (ttOutbound.SkillId == null) { ttOutbound.SkillId = skOutbound?.Id; }
            if (ttAudit.SkillId    == null) { ttAudit.SkillId    = skInventory?.Id; }
            if (ttEquip.SkillId    == null) { ttEquip.SkillId    = skForklift?.Id; }
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

            var managerUser = context.Users.FirstOrDefault(u => u.Email == "manager1@owrms.com");
            if (managerUser == null)
            {
                managerUser = new User
                {
                    Email        = "manager1@owrms.com",
                    FullName     = "Lê Thị Manager",
                    PasswordHash = defaultPasswordHash,
                    RoleId       = userRoleId,
                    Status       = "ACTIVE",
                    Phone        = "0905999888",
                    CreatedAt    = DateTime.UtcNow
                };
                context.Users.Add(managerUser);
                context.SaveChanges();
            }

            var managerMembership = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == managerUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (managerMembership == null)
            {
                managerMembership = new WarehouseMembership
                {
                    UserId          = managerUser.UserId,
                    WarehouseId     = warehouse.WarehouseId,
                    WarehouseRoleId = managerWhRole.Id,
                    IsActive        = true,
                    IsAllSkill      = true,
                    IsAllZone       = true,
                    CreatedAt       = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(managerMembership);
                context.SaveChanges();
            }

            if (!context.WarehouseTasks.Any())
            {
                var ttIds = context.TaskTypes.ToDictionary(t => t.Code, t => t.Id);
                var zA = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-A");
                var zB = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-B");
                var zA2 = context.Zones.First(z => z.WarehouseId == warehouse2.WarehouseId && z.Code == "Z-A");

                // Task 1: vệ sinh toàn kho 1 — IsAllZone=true, đã lên lịch 08:00 ngày 16/3
                var t1 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["GENERAL_CLEAN"], IsAllZone = true,  Status = "Pending",    ScheduledAt = new DateTime(2026,3,17,8,0,0,DateTimeKind.Utc),  Note = "Vệ sinh toàn bộ kho Hà Nội" };
                // Task 2: kiểm tra Zone A+B — IsAllZone=false, đã lên lịch 07:30 ngày 15/3
                var t2 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["ZONE_INSPECT"],  IsAllZone = false, Status = "InProgress", ScheduledAt = new DateTime(2026,3,15,7,30,0,DateTimeKind.Utc), Note = "Kiểm tra khu A và B" };
                // Task 3: nhập kho Zone A — IsAllZone=false, đã lên lịch 09:00 ngày 17/3
                var t3 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["INBOUND"],       IsAllZone = false, Status = "Pending",    ScheduledAt = new DateTime(2026,3,18,9,0,0,DateTimeKind.Utc),  Note = "Tiếp nhận lô hàng mới" };
                // Task 4: xuất kho Zone A — IsAllZone=false, đã lên lịch 10:00 ngày 18/3
                var t4 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["OUTBOUND"],      IsAllZone = false, Status = "Pending",    ScheduledAt = new DateTime(2026,3,19,10,0,0,DateTimeKind.Utc), Note = "Xuất hàng đơn #001" };
                // Task 5: kiểm kê Zone B — IsAllZone=false, đã lên lịch 08:00 ngày 19/3
                var t5 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["AUDIT"],         IsAllZone = false, Status = "Pending",    ScheduledAt = new DateTime(2026,3,20,8,0,0,DateTimeKind.Utc),  Note = "Kiểm kê Zone B" };
                // Task 6: bảo trì toàn kho 1 — IsAllZone=true, hoàn thành
                var t6 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["EQUIP_MAINT"],   IsAllZone = true,  Status = "Completed",  ScheduledAt = new DateTime(2026,3,16,8,0,0,DateTimeKind.Utc),  Note = "Bảo trì xe nâng" };
                // Task 7: vệ sinh kho 2 — IsAllZone=true, chưa lên lịch
                var t7 = new WarehouseTask { WarehouseId = warehouse2.WarehouseId, TaskTypeId = ttIds["GENERAL_CLEAN"], IsAllZone = true,  Status = "Pending",    ScheduledAt = null, Note = "Vệ sinh kho Hải Phòng" };
                // Task 8: OTHER kho 1 — IsAllZone=true, chưa lên lịch
                var t8 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["OTHER"],         IsAllZone = true,  Status = "Pending",    ScheduledAt = null, Note = "Hỗ trợ đặc biệt theo yêu cầu" };

                context.WarehouseTasks.AddRange(t1, t2, t3, t4, t5, t6, t7, t8);
                context.SaveChanges();

                // Gán zones cho task có IsAllZone=false
                t2.Zones.Add(zA); t2.Zones.Add(zB);
                t3.Zones.Add(zA);
                t4.Zones.Add(zA);
                t5.Zones.Add(zB);
                context.SaveChanges();
            }
        }
    }
}
