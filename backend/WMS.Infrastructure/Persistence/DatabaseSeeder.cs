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
            var skPicking   = context.Skills.FirstOrDefault(s => s.Code == "PICKING");
            var skPacking   = context.Skills.FirstOrDefault(s => s.Code == "PACKING");
            var skPutaway   = context.Skills.FirstOrDefault(s => s.Code == "PUTAWAY");

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
                new WarehouseRole { Code = "STAFF",    Name = "Nhân viên" },
                new WarehouseRole { Code = "RENTER",   Name = "Người thuê kho" }
            };

            foreach (var wr in whRoles)
            {
                if (!context.WarehouseRoles.Any(w => w.Code == wr.Code))
                {
                    context.WarehouseRoles.Add(wr);
                }
            }
            context.SaveChanges();

            // Truy vấn roles và skills
            var ownerWhRole    = context.WarehouseRoles.First(r => r.Code == "OWNER");
            var operatorWhRole = context.WarehouseRoles.First(r => r.Code == "OPERATOR");
            var staffWhRole    = context.WarehouseRoles.First(r => r.Code == "STAFF");
            var managerWhRole  = context.WarehouseRoles.First(r => r.Code == "MANAGER");
            var renterWhRole   = context.WarehouseRoles.First(r => r.Code == "RENTER");
            var inboundSkill   = context.Skills.First(s => s.Code == "INBOUND");
            var forkliftSkill  = context.Skills.First(s => s.Code == "FORKLIFT");
            var zoneAEntity    = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-A");
            var zoneBEntity    = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-B");

            var shiftData = new[]
            {
                new { Name = "Ca sáng",  StartTime = "07:00", EndTime = "12:00" },
                new { Name = "Ca chiều", StartTime = "13:00", EndTime = "17:00" },
                new { Name = "Cả ngày",  StartTime = "07:00", EndTime = "17:00" },
            };
            foreach (var s in shiftData)
            {
                if (!context.WarehouseShifts.Any(x => x.Name == s.Name && x.WarehouseId == warehouse.WarehouseId))
                {
                    context.WarehouseShifts.Add(new WarehouseShift
                    {
                        Name        = s.Name,
                        StartTime   = s.StartTime,
                        EndTime     = s.EndTime,
                        WarehouseId = warehouse.WarehouseId,
                    });
                }
            }
            context.SaveChanges();

            var shiftSang  = context.WarehouseShifts.First(s => s.Name == "Ca sáng"  && s.WarehouseId == warehouse.WarehouseId);
            var shiftNgay  = context.WarehouseShifts.First(s => s.Name == "Cả ngày" && s.WarehouseId == warehouse.WarehouseId);

            // ownerUser (owner@owrms.com) → OPERATOR membership cho warehouse 1
            // Phản ánh thiết kế: khi tạo kho, chủ kho tự động được gán OPERATOR để vận hành
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

            // operator1@owrms.com — OPERATOR riêng biệt (không phải chủ kho)
            var operatorUser = context.Users.FirstOrDefault(u => u.Email == "operator1@owrms.com");
            if (operatorUser == null)
            {
                operatorUser = new User
                {
                    Email        = "operator1@owrms.com",
                    FullName     = "Operator 1",
                    PasswordHash = defaultPasswordHash,
                    RoleId       = userRoleId,
                    Status       = "ACTIVE",
                    Phone        = "0912345678",
                    CreatedAt    = DateTime.UtcNow
                };
                context.Users.Add(operatorUser);
                context.SaveChanges();
            }

            // operator1 → OPERATOR membership cho warehouse 1
            var operatorMembership1 = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == operatorUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (operatorMembership1 == null)
            {
                operatorMembership1 = new WarehouseMembership
                {
                    UserId          = operatorUser.UserId,
                    WarehouseId     = warehouse.WarehouseId,
                    WarehouseRoleId = operatorWhRole.Id,
                    IsActive        = true,
                    IsAllSkill      = true,
                    IsAllZone       = true,
                    CreatedAt       = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(operatorMembership1);
                context.SaveChanges();
            }

            // operator1 → OPERATOR membership cho warehouse 2
            var operatorMembership2 = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == operatorUser.UserId && m.WarehouseId == warehouse2.WarehouseId);
            if (operatorMembership2 == null)
            {
                operatorMembership2 = new WarehouseMembership
                {
                    UserId          = operatorUser.UserId,
                    WarehouseId     = warehouse2.WarehouseId,
                    WarehouseRoleId = operatorWhRole.Id,
                    IsActive        = true,
                    IsAllSkill      = true,
                    IsAllZone       = true,
                    CreatedAt       = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(operatorMembership2);
                context.SaveChanges();
            }

            // user@owrms.com → STAFF membership trong warehouse 1 (có skill cụ thể)
            var membership = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == staffUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (membership == null)
            {
                membership = new WarehouseMembership
                {
                    UserId            = staffUser.UserId,
                    WarehouseId       = warehouse.WarehouseId,
                    WarehouseRoleId   = staffWhRole.Id,
                    WarehouseShiftId  = shiftSang.Id,
                    IsActive          = true,
                    CreatedAt         = DateTime.UtcNow
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
                    UserId            = staffUser.UserId,
                    WarehouseId       = warehouse2.WarehouseId,
                    WarehouseRoleId   = managerWhRole.Id,
                    WarehouseShiftId  = shiftNgay.Id,
                    IsActive          = true,
                    IsAllSkill        = true,
                    IsAllZone         = true,
                    CreatedAt         = DateTime.UtcNow
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
                var zoneCEntity = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-C");

                managerMembership = new WarehouseMembership
                {
                    UserId            = managerUser.UserId,
                    WarehouseId       = warehouse.WarehouseId,
                    WarehouseRoleId   = managerWhRole.Id,
                    WarehouseShiftId  = shiftNgay.Id,
                    IsActive          = true,
                    IsAllSkill        = false,
                    IsAllZone         = false,
                    CreatedAt         = DateTime.UtcNow
                };
                // Thêm skills cụ thể cho manager1
                if (skInbound   != null) managerMembership.Skills.Add(skInbound);
                if (skOutbound  != null) managerMembership.Skills.Add(skOutbound);
                if (skInventory != null) managerMembership.Skills.Add(skInventory);
                if (skForklift  != null) managerMembership.Skills.Add(skForklift);
                if (skPicking   != null) managerMembership.Skills.Add(skPicking);
                if (skPacking   != null) managerMembership.Skills.Add(skPacking);
                if (skPutaway   != null) managerMembership.Skills.Add(skPutaway);
                // Thêm tất cả zones trong kho 1 cho manager1
                managerMembership.Zones.Add(zoneAEntity);
                managerMembership.Zones.Add(zoneBEntity);
                managerMembership.Zones.Add(zoneCEntity);
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
            // ─── 30 nhân viên STAFF cho Kho Hà Nội ─────────────────────────────────────
            var allSkills = context.Skills.ToList();
            var skillMap  = allSkills.ToDictionary(s => s.Code, s => s);

            var thirtyStaff = new[]
            {
                ("Nguyễn Thị Hương",   "staff01@owrms.com", "0901000001", new[]{"INBOUND","OUTBOUND"}),
                ("Trần Văn Minh",      "staff02@owrms.com", "0901000002", new[]{"PICKING","PACKING"}),
                ("Lê Thị Lan",         "staff03@owrms.com", "0901000003", new[]{"INBOUND","FORKLIFT"}),
                ("Phạm Đức Thắng",     "staff04@owrms.com", "0901000004", new[]{"OUTBOUND","INVENTORY"}),
                ("Hoàng Thị Thu",      "staff05@owrms.com", "0901000005", new[]{"PACKING","INVENTORY"}),
                ("Vũ Minh Tuấn",       "staff06@owrms.com", "0901000006", new[]{"FORKLIFT","INBOUND"}),
                ("Đặng Thị Nga",       "staff07@owrms.com", "0901000007", new[]{"PICKING","OUTBOUND"}),
                ("Bùi Văn Hải",        "staff08@owrms.com", "0901000008", new[]{"INBOUND","PACKING"}),
                ("Dương Thị Bích",     "staff09@owrms.com", "0901000009", new[]{"INVENTORY","FORKLIFT"}),
                ("Ngô Văn Khánh",      "staff10@owrms.com", "0901000010", new[]{"OUTBOUND","PICKING"}),
                ("Trịnh Thị Mai",      "staff11@owrms.com", "0901000011", new[]{"INBOUND","INVENTORY"}),
                ("Đinh Văn Hùng",      "staff12@owrms.com", "0901000012", new[]{"FORKLIFT","PACKING"}),
                ("Lý Thị Quỳnh",       "staff13@owrms.com", "0901000013", new[]{"PICKING","INBOUND"}),
                ("Tăng Văn Phúc",      "staff14@owrms.com", "0901000014", new[]{"OUTBOUND","FORKLIFT"}),
                ("Cao Thị Hà",         "staff15@owrms.com", "0901000015", new[]{"INVENTORY","PACKING"}),
                ("Phan Văn Đạt",       "staff16@owrms.com", "0901000016", new[]{"INBOUND","PICKING"}),
                ("Mai Thị Liên",       "staff17@owrms.com", "0901000017", new[]{"FORKLIFT","OUTBOUND"}),
                ("Lưu Văn Toàn",       "staff18@owrms.com", "0901000018", new[]{"PACKING","INVENTORY"}),
                ("Đỗ Thị Phượng",      "staff19@owrms.com", "0901000019", new[]{"OUTBOUND","INBOUND"}),
                ("Hồ Văn Long",        "staff20@owrms.com", "0901000020", new[]{"PICKING","FORKLIFT"}),
                ("Từ Thị Nhung",       "staff21@owrms.com", "0901000021", new[]{"INBOUND","PACKING"}),
                ("Trương Văn Bình",    "staff22@owrms.com", "0901000022", new[]{"INVENTORY","OUTBOUND"}),
                ("Lâm Thị Kim",        "staff23@owrms.com", "0901000023", new[]{"FORKLIFT","PICKING"}),
                ("Kiều Văn Sơn",       "staff24@owrms.com", "0901000024", new[]{"PACKING","INBOUND"}),
                ("Tô Thị Diệu",        "staff25@owrms.com", "0901000025", new[]{"OUTBOUND","INVENTORY"}),
                ("Ông Văn Thành",      "staff26@owrms.com", "0901000026", new[]{"INBOUND","FORKLIFT","PICKING"}),
                ("Mạc Thị Hồng",       "staff27@owrms.com", "0901000027", new[]{"PACKING","OUTBOUND"}),
                ("Ninh Văn Cường",     "staff28@owrms.com", "0901000028", new[]{"INVENTORY","INBOUND"}),
                ("Châu Thị Xuân",      "staff29@owrms.com", "0901000029", new[]{"PICKING","PACKING","FORKLIFT"}),
                ("Quách Văn Nam",      "staff30@owrms.com", "0901000030", new[]{"OUTBOUND","INBOUND","INVENTORY"}),
            };

            foreach (var (fullName, email, phone, skillCodes) in thirtyStaff)
            {
                var u = context.Users.FirstOrDefault(x => x.Email == email);
                if (u == null)
                {
                    u = new User
                    {
                        Email        = email,
                        FullName     = fullName,
                        PasswordHash = defaultPasswordHash,
                        RoleId       = userRoleId,
                        Status       = "ACTIVE",
                        Phone        = phone,
                        CreatedAt    = DateTime.UtcNow
                    };
                    context.Users.Add(u);
                    context.SaveChanges();
                }

                var mem = context.WarehouseMemberships
                    .FirstOrDefault(m => m.UserId == u.UserId && m.WarehouseId == warehouse.WarehouseId);
                if (mem == null)
                {
                    mem = new WarehouseMembership
                    {
                        UserId           = u.UserId,
                        WarehouseId      = warehouse.WarehouseId,
                        WarehouseRoleId  = staffWhRole.Id,
                        WarehouseShiftId = shiftSang.Id,
                        IsActive         = true,
                        IsAllSkill       = false,
                        IsAllZone        = true,
                        CreatedAt        = DateTime.UtcNow
                    };
                    foreach (var code in skillCodes)
                        if (skillMap.TryGetValue(code, out var sk))
                            mem.Skills.Add(sk);
                    context.WarehouseMemberships.Add(mem);
                    context.SaveChanges();
                }
            }

            // ─── Patch memberships cu chua co WarehouseShiftId ─────────────────────
            // STAFF → Ca sang, MANAGER → Ca ngay (fallback: bat ky ca nao cua kho)
            var nullShiftMembers = context.WarehouseMemberships
                .Include(m => m.Role)
                .Where(m => m.IsActive && m.WarehouseShiftId == null)
                .ToList();

            if (nullShiftMembers.Any())
            {
                // Build lookup: warehouseId → shift list (chi lay shift co WarehouseId)
                var allShifts = context.WarehouseShifts
                    .Where(s => s.WarehouseId != null)
                    .ToList();
                var shiftsByWh = allShifts
                    .GroupBy(s => s.WarehouseId!.Value)
                    .ToDictionary(g => g.Key, g => g.ToList());

                foreach (var m in nullShiftMembers)
                {
                    var roleCode = m.Role?.Code;
                    if (roleCode == null) continue;

                    if (!shiftsByWh.TryGetValue(m.WarehouseId, out var shifts) || shifts.Count == 0)
                        continue;  // kho nay chua co ca → bo qua (ca xoay)

                    if (roleCode == "STAFF")
                        m.WarehouseShiftId = shifts.FirstOrDefault(s =>
                            s.Name.Contains("sáng") || s.Name.Contains("sang") ||
                            s.Name.Contains("Sáng") || s.Name.Contains("Sang"))?.Id
                            ?? shifts[0].Id;
                    else if (roleCode == "MANAGER")
                        m.WarehouseShiftId = shifts.FirstOrDefault(s =>
                            s.Name.Contains("ngày") || s.Name.Contains("ngay") ||
                            s.Name.Contains("Ngày") || s.Name.Contains("Ngay"))?.Id
                            ?? shifts[0].Id;
                    else
                        m.WarehouseShiftId = shifts.First().Id;
                }
                context.SaveChanges();
            }

            // ─── Tài khoản USER thường, không gắn với kho nào ───────────────────────
            var plainUsers = new[]
            {
                ("Nguyễn Thành Đạt",  "user1@owrms.com", "0911111001"),
                ("Trần Thị Mỹ Linh",  "user2@owrms.com", "0911111002"),
                ("Lê Văn Phong",       "user3@owrms.com", "0911111003"),
                ("Phạm Ngọc Hân",      "user4@owrms.com", "0911111004"),
                ("Hoàng Minh Quân",    "user5@owrms.com", "0911111005"),
            };

            foreach (var (fullName, email, phone) in plainUsers)
            {
                if (!context.Users.Any(u => u.Email == email))
                {
                    context.Users.Add(new User
                    {
                        Email        = email,
                        FullName     = fullName,
                        PasswordHash = defaultPasswordHash,
                        RoleId       = userRoleId,
                        Status       = "ACTIVE",
                        Phone        = phone,
                        CreatedAt    = DateTime.UtcNow
                    });
                }
            }
            context.SaveChanges();

            // ─── Tài khoản RENTER (người thuê kho) ──────────────────────────────────
            var renterData = new[]
            {
                ("Nguyễn Văn Renter",  "renter1@owrms.com", "0922000001"),
                ("Trần Thị Renter",    "renter2@owrms.com", "0922000002"),
                ("Lê Minh Renter",     "renter3@owrms.com", "0922000003"),
            };

            foreach (var (fullName, email, phone) in renterData)
            {
                var renterUser = context.Users.FirstOrDefault(u => u.Email == email);
                if (renterUser == null)
                {
                    renterUser = new User
                    {
                        Email        = email,
                        FullName     = fullName,
                        PasswordHash = defaultPasswordHash,
                        RoleId       = userRoleId,
                        Status       = "ACTIVE",
                        Phone        = phone,
                        CreatedAt    = DateTime.UtcNow
                    };
                    context.Users.Add(renterUser);
                    context.SaveChanges();
                }

                // Thêm membership RENTER cho warehouse 1
                if (!context.WarehouseMemberships.Any(m => m.UserId == renterUser.UserId && m.WarehouseId == warehouse.WarehouseId))
                {
                    context.WarehouseMemberships.Add(new WarehouseMembership
                    {
                        UserId          = renterUser.UserId,
                        WarehouseId     = warehouse.WarehouseId,
                        WarehouseRoleId = renterWhRole.Id,
                        IsActive        = true,
                        IsAllSkill      = false,
                        IsAllZone       = false,
                        CreatedAt       = DateTime.UtcNow
                    });
                }

                // Thêm membership RENTER cho warehouse 2
                if (!context.WarehouseMemberships.Any(m => m.UserId == renterUser.UserId && m.WarehouseId == warehouse2.WarehouseId))
                {
                    context.WarehouseMemberships.Add(new WarehouseMembership
                    {
                        UserId          = renterUser.UserId,
                        WarehouseId     = warehouse2.WarehouseId,
                        WarehouseRoleId = renterWhRole.Id,
                        IsActive        = true,
                        IsAllSkill      = false,
                        IsAllZone       = false,
                        CreatedAt       = DateTime.UtcNow
                    });
                }
            }
            context.SaveChanges();

            // ─── Seed Contract + Payment (để test) ──────────────────────────────────
            var renter1 = context.Users.FirstOrDefault(u => u.Email == "renter1@owrms.com");
            var renter2 = context.Users.FirstOrDefault(u => u.Email == "renter2@owrms.com");
            var renter3 = context.Users.FirstOrDefault(u => u.Email == "renter3@owrms.com");

            if (renter1 != null && renter2 != null && !context.Contracts.Any())
            {
                // Seed RentalRequest trước (Contract có FK → RentalRequest)
                var req1 = new RentalRequest { RenterId = renter1.UserId, WarehouseId = warehouse.WarehouseId,  RequestedArea = 200, StartDate = new DateTime(2024,1,1), DurationMonths = 12, Status = "APPROVED", CreatedAt = new DateTime(2024,1,1) };
                var req2 = new RentalRequest { RenterId = renter2.UserId, WarehouseId = warehouse2.WarehouseId, RequestedArea = 100, StartDate = new DateTime(2024,3,1), DurationMonths = 12, Status = "APPROVED", CreatedAt = new DateTime(2024,3,1) };
                context.RentalRequests.AddRange(req1, req2);
                RentalRequest? req3 = null;
                if (renter3 != null)
                {
                    req3 = new RentalRequest { RenterId = renter3.UserId, WarehouseId = warehouse.WarehouseId, RequestedArea = 150, StartDate = new DateTime(2024,6,1), DurationMonths = 12, Status = "APPROVED", CreatedAt = new DateTime(2024,6,1) };
                    context.RentalRequests.Add(req3);
                }
                context.SaveChanges();

                // Hợp đồng 1: renter1 thuê warehouse 1
                var contract1 = new Contract
                {
                    RenterId       = renter1.UserId,
                    WarehouseId    = warehouse.WarehouseId,
                    RequestId      = req1.RequestId,
                    ContractNumber = "HD-2024-001",
                    StartDate      = new DateOnly(2024, 1, 1),
                    EndDate        = new DateOnly(2025, 1, 1),
                    Status         = "ACTIVE",
                    TotalValue     = 120_000_000,
                    MonthlyPayment = 10_000_000,
                    DepositAmount  = 20_000_000,
                    CreatedAt      = new DateTime(2024, 1, 1),
                };
                // Hợp đồng 2: renter2 thuê warehouse 2
                var contract2 = new Contract
                {
                    RenterId       = renter2.UserId,
                    WarehouseId    = warehouse2.WarehouseId,
                    RequestId      = req2.RequestId,
                    ContractNumber = "HD-2024-002",
                    StartDate      = new DateOnly(2024, 3, 1),
                    EndDate        = new DateOnly(2025, 3, 1),
                    Status         = "ACTIVE",
                    TotalValue     = 60_000_000,
                    MonthlyPayment = 5_000_000,
                    DepositAmount  = 10_000_000,
                    CreatedAt      = new DateTime(2024, 3, 1),
                };
                // Hợp đồng 3: renter3 thuê warehouse 1
                var contract3 = renter3 == null ? null : new Contract
                {
                    RenterId       = renter3!.UserId,
                    WarehouseId    = warehouse.WarehouseId,
                    RequestId      = req3!.RequestId,
                    ContractNumber = "HD-2024-003",
                    StartDate      = new DateOnly(2024, 6, 1),
                    EndDate        = new DateOnly(2025, 6, 1),
                    Status         = "ACTIVE",
                    TotalValue     = 96_000_000,
                    MonthlyPayment = 8_000_000,
                    DepositAmount  = 16_000_000,
                    CreatedAt      = new DateTime(2024, 6, 1),
                };

                context.Contracts.Add(contract1);
                context.Contracts.Add(contract2);
                if (contract3 != null) context.Contracts.Add(contract3);
                context.SaveChanges();

                // ── Payments cho contract1 ──
                var payments1 = new[]
                {
                    new Payment { ContractId = contract1.ContractId, Amount = 10_000_000, PaymentPeriod = "T1/2024", PaymentDate = new DateTime(2024,1,5),  DueDate = new DateOnly(2024,1,10),  PaymentMethod = "Chuyển khoản", Status = "PAID",    TransactionReference = "MB24010001", CreatedAt = new DateTime(2024,1,5)  },
                    new Payment { ContractId = contract1.ContractId, Amount = 10_000_000, PaymentPeriod = "T2/2024", PaymentDate = new DateTime(2024,2,6),  DueDate = new DateOnly(2024,2,10),  PaymentMethod = "Chuyển khoản", Status = "PAID",    TransactionReference = "MB24020001", CreatedAt = new DateTime(2024,2,6)  },
                    new Payment { ContractId = contract1.ContractId, Amount = 10_000_000, PaymentPeriod = "T3/2024", PaymentDate = new DateTime(2024,3,4),  DueDate = new DateOnly(2024,3,10),  PaymentMethod = "Tiền mặt",     Status = "PAID",    TransactionReference = null,         CreatedAt = new DateTime(2024,3,4)  },
                    new Payment { ContractId = contract1.ContractId, Amount = 10_000_000, PaymentPeriod = "T4/2024", PaymentDate = null,                    DueDate = new DateOnly(2024,4,10),  PaymentMethod = null,           Status = "OVERDUE",  TransactionReference = null,         CreatedAt = new DateTime(2024,4,1)  },
                    new Payment { ContractId = contract1.ContractId, Amount = 10_000_000, PaymentPeriod = "T5/2024", PaymentDate = null,                    DueDate = new DateOnly(2024,5,10),  PaymentMethod = null,           Status = "PENDING",  TransactionReference = null,         CreatedAt = new DateTime(2024,5,1)  },
                };

                // ── Payments cho contract2 ──
                var payments2 = new[]
                {
                    new Payment { ContractId = contract2.ContractId, Amount = 5_000_000, PaymentPeriod = "T3/2024", PaymentDate = new DateTime(2024,3,8),  DueDate = new DateOnly(2024,3,10), PaymentMethod = "Chuyển khoản", Status = "PAID",   TransactionReference = "VCB24030001", CreatedAt = new DateTime(2024,3,8) },
                    new Payment { ContractId = contract2.ContractId, Amount = 5_000_000, PaymentPeriod = "T4/2024", PaymentDate = new DateTime(2024,4,9),  DueDate = new DateOnly(2024,4,10), PaymentMethod = "Chuyển khoản", Status = "PAID",   TransactionReference = "VCB24040001", CreatedAt = new DateTime(2024,4,9) },
                    new Payment { ContractId = contract2.ContractId, Amount = 5_000_000, PaymentPeriod = "T5/2024", PaymentDate = null,                   DueDate = new DateOnly(2024,5,10), PaymentMethod = null,           Status = "PENDING", TransactionReference = null,          CreatedAt = new DateTime(2024,5,1) },
                };

                context.Payments.AddRange(payments1);
                context.Payments.AddRange(payments2);

                if (contract3 != null)
                {
                    var payments3 = new[]
                    {
                        new Payment { ContractId = contract3.ContractId, Amount = 8_000_000, PaymentPeriod = "T6/2024", PaymentDate = new DateTime(2024,6,7), DueDate = new DateOnly(2024,6,10), PaymentMethod = "Chuyển khoản", Status = "PAID",   TransactionReference = "TCB24060001", CreatedAt = new DateTime(2024,6,7) },
                        new Payment { ContractId = contract3.ContractId, Amount = 8_000_000, PaymentPeriod = "T7/2024", PaymentDate = null,                   DueDate = new DateOnly(2024,7,10), PaymentMethod = null,           Status = "OVERDUE", TransactionReference = null,          CreatedAt = new DateTime(2024,7,1) },
                    };
                    context.Payments.AddRange(payments3);
                }

                context.SaveChanges();
            }
        }
    }
}
