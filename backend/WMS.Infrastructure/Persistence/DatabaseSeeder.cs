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
            // ══════════════════════════════════════════════════
            // 1. ROLES
            // ══════════════════════════════════════════════════
            var roles = new[]
            {
                new Role { RoleName = "ADMIN",   Description = "Quản trị viên hệ thống" },
                new Role { RoleName = "OWNER",   Description = "Chủ kho" },
                new Role { RoleName = "RENTER",  Description = "Người thuê kho" },
                new Role { RoleName = "STAFF",   Description = "Nhân viên kho" },
                new Role { RoleName = "MANAGER", Description = "Quản lý kho" },
                new Role { RoleName = "USER",    Description = "Người dùng chung" }
            };

            foreach (var role in roles)
            {
                if (!context.Roles.Any(r => r.RoleName == role.RoleName))
                    context.Roles.Add(role);
            }
            context.SaveChanges();

            var adminRoleId   = context.Roles.First(r => r.RoleName == "ADMIN").RoleId;
            var ownerRoleId   = context.Roles.First(r => r.RoleName == "OWNER").RoleId;
            var renterRoleId  = context.Roles.First(r => r.RoleName == "RENTER").RoleId;
            var staffRoleId   = context.Roles.First(r => r.RoleName == "STAFF").RoleId;
            var managerRoleId = context.Roles.First(r => r.RoleName == "MANAGER").RoleId;
            var userRoleId    = context.Roles.First(r => r.RoleName == "USER").RoleId;

            string defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("123456");
            string pw = defaultPasswordHash;

            // ══════════════════════════════════════════════════
            // 2. USERS — đủ mỗi role, password: 123456
            // ══════════════════════════════════════════════════
            var adminUser   = EnsureUser(context, "admin@owrms.com",    "Quản Trị Viên",       pw, adminRoleId,   "0900000001");
            var ownerUser   = EnsureUser(context, "owner@owrms.com",    "Trần Văn B - Chủ Kho", pw, ownerRoleId,   "0900000002");
            var ownerUser2  = EnsureUser(context, "owner2@owrms.com",   "Phạm Thị C - Chủ Kho 2", pw, ownerRoleId, "0900000003");
            var renterUser  = EnsureUser(context, "renter@owrms.com",   "Lê Văn D - Người Thuê", pw, renterRoleId,  "0900000004");
            var renterUser2 = EnsureUser(context, "renter2@owrms.com",  "Ngô Thị E - Người Thuê 2", pw, renterRoleId, "0900000005");
            var staffUser   = EnsureUser(context, "staff@owrms.com",    "Nguyễn Văn F - Nhân Viên", pw, staffRoleId,  "0900000006");
            var staffUser2  = EnsureUser(context, "staff2@owrms.com",   "Hoàng Văn G - Nhân Viên 2", pw, staffRoleId, "0900000007");
            var managerUser = EnsureUser(context, "manager@owrms.com",  "Đỗ Thị H - Quản Lý", pw, managerRoleId, "0900000008");
            // backward-compat old emails
            EnsureUser(context, "user@owrms.com",     "Nguyễn Văn A",     pw, staffRoleId,   "0123456781");
            EnsureUser(context, "manager1@owrms.com", "Lê Thị Manager",   pw, managerRoleId, "0905999888");
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

            var warehouse3 = context.Warehouses.FirstOrDefault(w => w.Name == "Kho TP.HCM");
            if (warehouse3 == null)
            {
                warehouse3 = new Warehouse
                {
                    Name           = "Kho TP.HCM",
                    Address        = "789 Đường Nguyễn Văn Linh, Quận 7, TP.HCM",
                    OwnerId        = ownerUser2.UserId,
                    TotalArea      = 8000,
                    AvailableArea  = 8000,
                    Status         = "APPROVED",
                    Description    = "Kho tổng khu vực phía Nam",
                    Lat            = 10.7322,
                    Lng            = 106.7225,
                    OperatingHours = "06:00 - 22:00",
                    CreatedAt      = DateTime.UtcNow,
                    ApprovedAt     = DateTime.UtcNow,
                    ApprovedBy     = adminUser.UserId,
                    HasZone        = true
                };
                context.Warehouses.Add(warehouse3);
                context.SaveChanges();
            }

            // Add Zones for warehouse 1
            if (!context.Zones.Any(z => z.WarehouseId == warehouse.WarehouseId))
            {
                context.Zones.AddRange(
                    new Zone { Code = "Z-A", Name = "Khu A - Thường",         WarehouseId = warehouse.WarehouseId, Description = "Khu vực lưu trữ hàng hóa chung",  IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Zone { Code = "Z-B", Name = "Khu B - Lạnh",           WarehouseId = warehouse.WarehouseId, Description = "Khu vực lưu trữ hàng hóa lạnh",  IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Zone { Code = "Z-C", Name = "Khu C - Hàng Nguy Hiểm", WarehouseId = warehouse.WarehouseId, Description = "Khu vực đặc biệt",               IsActive = true, CreatedAt = DateTime.UtcNow }
                );
                context.SaveChanges();
            }

            if (!context.Zones.Any(z => z.WarehouseId == warehouse2.WarehouseId))
            {
                context.Zones.AddRange(
                    new Zone { Code = "Z-A", Name = "Khu A - Cảng",      WarehouseId = warehouse2.WarehouseId, Description = "Khu tiếp nhận container từ cảng",  IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Zone { Code = "Z-B", Name = "Khu B - Khô",       WarehouseId = warehouse2.WarehouseId, Description = "Khu lưu trữ hàng hóa khô",          IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Zone { Code = "Z-C", Name = "Khu C - Lạnh",      WarehouseId = warehouse2.WarehouseId, Description = "Khu lưu trữ hàng đông lạnh",         IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Zone { Code = "Z-D", Name = "Khu D - Xuất khẩu", WarehouseId = warehouse2.WarehouseId, Description = "Khu tập kết hàng chờ xuất khẩu",    IsActive = true, CreatedAt = DateTime.UtcNow }
                );
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

            // ══════════════════════════════════════════════════
            // 6. TASK TYPES
            // ══════════════════════════════════════════════════
            var taskTypeData = new (string Code, string Name, string Desc, bool AllSkill)[]
            {
                ("INBOUND",       "Nhập kho",          "Tiếp nhận hàng hoá vào kho",             false),
                ("OUTBOUND",      "Xuất kho",          "Xuất hàng hoá ra khỏi kho",              false),
                ("AUDIT",         "Kiểm kê định kỳ",   "Đếm và đối chiếu tồn kho",              false),
                ("EQUIP_MAINT",   "Bảo trì thiết bị",  "Bảo dưỡng và sửa chữa thiết bị kho",    false),
                ("GENERAL_CLEAN", "Vệ sinh kho",       "Vệ sinh toàn bộ hoặc khu vực kho",       true),
                ("ZONE_INSPECT",  "Kiểm tra khu vực",  "Tuần tra và kiểm tra tình trạng zone",   true),
                ("OTHER",         "Khác",              "Task tổng quát",                          true),
            };
            foreach (var tt in taskTypeData)
            {
                if (!context.TaskTypes.Any(t => t.Code == tt.Code))
                    context.TaskTypes.Add(new TaskType { Code = tt.Code, Name = tt.Name, Description = tt.Desc, IsAllSkill = tt.AllSkill });
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

            // ══════════════════════════════════════════════════
            // 7. WAREHOUSE ROLES
            // ══════════════════════════════════════════════════
            var whRoleData = new[] {
                ("OWNER",    "Chủ kho"),
                ("MANAGER",  "Quản lý kho"),
                ("OPERATOR", "Điều phối viên"),
                ("STAFF",    "Nhân viên"),
                ("RENTER",   "Khách thuê"),
            };
            foreach (var (code, name) in whRoleData)
            {
                if (!context.WarehouseRoles.Any(w => w.Code == code))
                    context.WarehouseRoles.Add(new WarehouseRole { Code = code, Name = name });
            }
            context.SaveChanges();

            // Truy vấn roles và skills
            var ownerWhRole    = context.WarehouseRoles.First(r => r.Code == "OWNER");
            var operatorWhRole = context.WarehouseRoles.First(r => r.Code == "OPERATOR");
            var staffWhRole    = context.WarehouseRoles.First(r => r.Code == "STAFF");
            var managerWhRole  = context.WarehouseRoles.First(r => r.Code == "MANAGER");
            var renterWhRole   = context.WarehouseRoles.First(r => r.Code == "RENTER");
            var checkOrderSkill    = context.Skills.FirstOrDefault(s => s.Code == "CHECK_ORDER");
            var putawaySkill       = context.Skills.FirstOrDefault(s => s.Code == "PUTAWAY");
            var inventoryCountSkill = context.Skills.FirstOrDefault(s => s.Code == "INVENTORY_COUNT");
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

            // ══════════════════════════════════════════════════
            // 8. WAREHOUSE MEMBERSHIPS
            // ══════════════════════════════════════════════════
            // Owner → OPERATOR trên kho của mình
            EnsureMembership(context, ownerUser.UserId,  warehouse.WarehouseId,  operatorWhRole.Id, true, true);
            EnsureMembership(context, ownerUser.UserId,  warehouse2.WarehouseId, operatorWhRole.Id, true, true);
            EnsureMembership(context, ownerUser2.UserId, warehouse3.WarehouseId, operatorWhRole.Id, true, true);

            // Staff → STAFF membership (skill + zone cụ thể)
            var staffMembership = EnsureMembership(context, staffUser.UserId, warehouse.WarehouseId, staffWhRole.Id, false, false);
            // Eagerly load collections to check existence
            context.Entry(staffMembership).Collection(m => m.Skills).Load();
            context.Entry(staffMembership).Collection(m => m.Zones).Load();
            if (!staffMembership.Skills.Any())
            {
                if (skInbound != null)  staffMembership.Skills.Add(skInbound);
                if (skForklift != null) staffMembership.Skills.Add(skForklift);
                context.SaveChanges();
            }
            if (!staffMembership.Zones.Any())
            {
                var zA = context.Zones.FirstOrDefault(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-A");
                var zB = context.Zones.FirstOrDefault(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-B");
                if (zA != null) staffMembership.Zones.Add(zA);
                if (zB != null) staffMembership.Zones.Add(zB);
                context.SaveChanges();
            }
            EnsureMembership(context, staffUser2.UserId, warehouse3.WarehouseId, staffWhRole.Id, true, true);

            // Manager → MANAGER membership
            EnsureMembership(context, managerUser.UserId, warehouse.WarehouseId,  managerWhRole.Id, true, true);
            EnsureMembership(context, managerUser.UserId, warehouse2.WarehouseId, managerWhRole.Id, true, true);

            // backwards compat old users
            var oldStaff = context.Users.FirstOrDefault(u => u.Email == "user@owrms.com");
            if (oldStaff != null)
            {
                EnsureMembership(context, oldStaff.UserId, warehouse.WarehouseId, staffWhRole.Id, false, false);
                EnsureMembership(context, oldStaff.UserId, warehouse2.WarehouseId, managerWhRole.Id, true, true);
            }
            var oldManager = context.Users.FirstOrDefault(u => u.Email == "manager1@owrms.com");
            if (oldManager != null)
                EnsureMembership(context, oldManager.UserId, warehouse.WarehouseId, managerWhRole.Id, true, true);

            // ══════════════════════════════════════════════════
            // 9. RENTAL REQUESTS + CONTRACTS + PAYMENTS
            // ══════════════════════════════════════════════════
            if (!context.RentalRequests.Any())
            {
                var now = DateTime.UtcNow;

                // RentalRequest 1: renter thuê kho 1, approved → contract active
                var rr1 = new RentalRequest
                {
                    RenterId      = renterUser.UserId,
                    WarehouseId   = warehouse.WarehouseId,
                    RequestedArea = 500,
                    StartDate     = now.AddMonths(-6),
                    DurationMonths = 12,
                    Status        = "APPROVED",
                    Notes         = "Thuê khu A để lưu trữ hàng điện tử",
                    CreatedAt     = now.AddMonths(-7),
                    ReviewedBy    = ownerUser.UserId,
                    ReviewedAt    = now.AddMonths(-6).AddDays(-5),
                };
                context.RentalRequests.Add(rr1);
                context.SaveChanges();

                var c1 = new Contract
                {
                    RequestId      = rr1.RequestId,
                    RenterId       = renterUser.UserId,
                    WarehouseId    = warehouse.WarehouseId,
                    ContractNumber = "HD-2025-001",
                    StartDate      = DateOnly.FromDateTime(now.AddMonths(-6)),
                    EndDate        = DateOnly.FromDateTime(now.AddMonths(6)),
                    Status         = "ACTIVE",
                    TotalValue     = 120_000_000m,
                    DepositAmount  = 20_000_000m,
                    MonthlyPayment = 10_000_000m,
                    CreatedAt      = now.AddMonths(-6),
                };
                context.Contracts.Add(c1);
                context.SaveChanges();

                // payments cho contract 1 — 6 tháng đã trả, 1 pending, 1 overdue
                for (int i = 0; i < 8; i++)
                {
                    var payDate = now.AddMonths(-6 + i);
                    var status  = i < 6 ? "PAID" : i == 6 ? "PENDING" : "OVERDUE";
                    context.Payments.Add(new Payment
                    {
                        ContractId          = c1.ContractId,
                        Amount              = 10_000_000m,
                        PaymentPeriod       = $"{payDate:MM/yyyy}",
                        PaymentDate         = status == "PAID" ? payDate : null,
                        DueDate             = DateOnly.FromDateTime(payDate.AddDays(5)),
                        PaymentMethod       = status == "PAID" ? "BANK_TRANSFER" : null,
                        Status              = status,
                        TransactionReference = status == "PAID" ? $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}" : null,
                        CreatedAt           = payDate.AddDays(-5),
                    });
                }
                context.SaveChanges();

                // RentalRequest 2: renter thuê kho 2, approved → contract active
                var rr2 = new RentalRequest
                {
                    RenterId       = renterUser.UserId,
                    WarehouseId    = warehouse2.WarehouseId,
                    RequestedArea  = 300,
                    StartDate      = now.AddMonths(-3),
                    DurationMonths = 6,
                    Status         = "APPROVED",
                    Notes          = "Thuê kho Hải Phòng cho hàng xuất khẩu",
                    CreatedAt      = now.AddMonths(-4),
                    ReviewedBy     = ownerUser.UserId,
                    ReviewedAt     = now.AddMonths(-3).AddDays(-2),
                };
                context.RentalRequests.Add(rr2);
                context.SaveChanges();

                var c2 = new Contract
                {
                    RequestId      = rr2.RequestId,
                    RenterId       = renterUser.UserId,
                    WarehouseId    = warehouse2.WarehouseId,
                    ContractNumber = "HD-2025-002",
                    StartDate      = DateOnly.FromDateTime(now.AddMonths(-3)),
                    EndDate        = DateOnly.FromDateTime(now.AddMonths(3)),
                    Status         = "ACTIVE",
                    TotalValue     = 42_000_000m,
                    DepositAmount  = 14_000_000m,
                    MonthlyPayment = 7_000_000m,
                    CreatedAt      = now.AddMonths(-3),
                };
                context.Contracts.Add(c2);
                context.SaveChanges();

                for (int i = 0; i < 3; i++)
                {
                    context.Payments.Add(new Payment
                    {
                        ContractId    = c2.ContractId,
                        Amount        = 7_000_000m,
                        PaymentPeriod = $"{now.AddMonths(-3 + i):MM/yyyy}",
                        PaymentDate   = now.AddMonths(-3 + i),
                        DueDate       = DateOnly.FromDateTime(now.AddMonths(-3 + i).AddDays(5)),
                        PaymentMethod = "BANK_TRANSFER",
                        Status        = "PAID",
                        TransactionReference = $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}",
                        CreatedAt     = now.AddMonths(-3 + i).AddDays(-3),
                    });
                }
                context.SaveChanges();

                // RentalRequest 3: renter2 thuê kho 3, approved → contract expiring
                var rr3 = new RentalRequest
                {
                    RenterId       = renterUser2.UserId,
                    WarehouseId    = warehouse3.WarehouseId,
                    RequestedArea  = 1000,
                    StartDate      = now.AddMonths(-11),
                    DurationMonths = 12,
                    Status         = "APPROVED",
                    Notes          = "Thuê kho lớn tại TP.HCM",
                    CreatedAt      = now.AddMonths(-12),
                    ReviewedBy     = ownerUser2.UserId,
                    ReviewedAt     = now.AddMonths(-11).AddDays(-3),
                };
                context.RentalRequests.Add(rr3);
                context.SaveChanges();

                var c3 = new Contract
                {
                    RequestId      = rr3.RequestId,
                    RenterId       = renterUser2.UserId,
                    WarehouseId    = warehouse3.WarehouseId,
                    ContractNumber = "HD-2025-003",
                    StartDate      = DateOnly.FromDateTime(now.AddMonths(-11)),
                    EndDate        = DateOnly.FromDateTime(now.AddMonths(1)),  // sắp hết hạn
                    Status         = "ACTIVE",
                    TotalValue     = 180_000_000m,
                    DepositAmount  = 30_000_000m,
                    MonthlyPayment = 15_000_000m,
                    CreatedAt      = now.AddMonths(-11),
                };
                context.Contracts.Add(c3);
                context.SaveChanges();

                for (int i = 0; i < 11; i++)
                {
                    context.Payments.Add(new Payment
                    {
                        ContractId    = c3.ContractId,
                        Amount        = 15_000_000m,
                        PaymentPeriod = $"{now.AddMonths(-11 + i):MM/yyyy}",
                        PaymentDate   = now.AddMonths(-11 + i),
                        DueDate       = DateOnly.FromDateTime(now.AddMonths(-11 + i).AddDays(5)),
                        PaymentMethod = "BANK_TRANSFER",
                        Status        = "PAID",
                        TransactionReference = $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}",
                        CreatedAt     = now.AddMonths(-11 + i).AddDays(-2),
                    });
                }
                // 1 pending nữa
                context.Payments.Add(new Payment
                {
                    ContractId    = c3.ContractId,
                    Amount        = 15_000_000m,
                    PaymentPeriod = $"{now:MM/yyyy}",
                    DueDate       = DateOnly.FromDateTime(now.AddDays(10)),
                    Status        = "PENDING",
                    CreatedAt     = now.AddDays(-5),
                });
                context.SaveChanges();

                // RentalRequest 4: pending — renter2 xin thuê thêm kho 1
                context.RentalRequests.Add(new RentalRequest
                {
                    RenterId       = renterUser2.UserId,
                    WarehouseId    = warehouse.WarehouseId,
                    RequestedArea  = 200,
                    StartDate      = now.AddMonths(1),
                    DurationMonths = 6,
                    Status         = "PENDING",
                    Notes          = "Muốn thuê thêm diện tích tại Hà Nội",
                    CreatedAt      = now.AddDays(-3),
                });
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

            // trandinhkhai09072003 → STAFF membership trong warehouse 1 (skill PUTAWAY)
            var membership = context.WarehouseMemberships
                .Include(m => m.Skills)
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
                    IsAllSkill        = false,
                    CreatedAt         = DateTime.UtcNow
                };
                if (putawaySkill != null) membership.Skills.Add(putawaySkill);
                context.WarehouseMemberships.Add(membership);
                context.SaveChanges();
            }

            // trandinhkhai09072003 → MANAGER membership trong warehouse 2 (isAllSkill = true by default)
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
                    IsAllSkill        = true,   // Manager mặc định quản lý toàn bộ skill
                    IsAllZone         = false,
                    CreatedAt         = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(membership2);
                context.SaveChanges();
            }

            // ══════════════════════════════════════════════════
            // 10. AUDIT SESSIONS + RESULTS
            // ══════════════════════════════════════════════════
            if (!context.AuditSessions.Any())
            {
                var now = DateTime.UtcNow;

                // Audit 1: completed — kho Hà Nội
                var a1 = new AuditSession
                {
                    WarehouseId = warehouse.WarehouseId,
                    CreatedBy   = ownerUser.UserId,
                    Status      = "COMPLETED",
                    CreatedAt   = now.AddMonths(-2),
                    CompletedAt = now.AddMonths(-2).AddDays(1),
                    Notes       = "Kiểm kê định kỳ tháng — Kho Hà Nội",
                };
                context.AuditSessions.Add(a1);
                context.SaveChanges();

                context.AuditResults.AddRange(
                    new AuditResult { AuditId = a1.AuditId, ItemName = "Laptop Dell XPS 15",      ExpectedQty = 100, ActualQty = 100, Discrepancy = 0,  RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-2) },
                    new AuditResult { AuditId = a1.AuditId, ItemName = "iPhone 15 Pro",           ExpectedQty = 200, ActualQty = 198, Discrepancy = -2, DiscrepancyReason = "2 chiếc bị hư hỏng trong quá trình vận chuyển", RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-2) },
                    new AuditResult { AuditId = a1.AuditId, ItemName = "Tai nghe Sony WH-1000",   ExpectedQty = 50,  ActualQty = 50,  Discrepancy = 0,  RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-2) },
                    new AuditResult { AuditId = a1.AuditId, ItemName = "iPad Air M2",             ExpectedQty = 80,  ActualQty = 82,  Discrepancy = 2,  DiscrepancyReason = "Thêm 2 chiếc từ đơn hàng trả lại", RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-2) },
                    new AuditResult { AuditId = a1.AuditId, ItemName = "Samsung Galaxy S24",       ExpectedQty = 150, ActualQty = 147, Discrepancy = -3, DiscrepancyReason = "Thiếu 3 — đang điều tra", RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-2) }
                );
                context.SaveChanges();

                // Audit 2: OPEN — kho Hà Nội (đang kiểm kê)
                var a2 = new AuditSession
                {
                    WarehouseId = warehouse.WarehouseId,
                    CreatedBy   = ownerUser.UserId,
                    Status      = "OPEN",
                    CreatedAt   = now.AddDays(-2),
                    Notes       = "Kiểm kê đầu tháng — Kho Hà Nội",
                };
                context.AuditSessions.Add(a2);
                context.SaveChanges();

                context.AuditResults.AddRange(
                    new AuditResult { AuditId = a2.AuditId, ItemName = "Bàn phím cơ Logitech",   ExpectedQty = 60,  ActualQty = 60,  Discrepancy = 0,  RecordedBy = ownerUser.UserId, CreatedAt = now.AddDays(-1) },
                    new AuditResult { AuditId = a2.AuditId, ItemName = "Chuột không dây Razer",   ExpectedQty = 45,  ActualQty = 43,  Discrepancy = -2, DiscrepancyReason = "Thiếu 2, cần kiểm tra zone B", RecordedBy = ownerUser.UserId, CreatedAt = now.AddDays(-1) }
                );
                context.SaveChanges();

                // Audit 3: COMPLETED — kho Hải Phòng
                var a3 = new AuditSession
                {
                    WarehouseId = warehouse2.WarehouseId,
                    CreatedBy   = ownerUser.UserId,
                    Status      = "COMPLETED",
                    CreatedAt   = now.AddMonths(-1),
                    CompletedAt = now.AddMonths(-1).AddDays(2),
                    Notes       = "Kiểm kê cuối quý — Kho Hải Phòng",
                };
                context.AuditSessions.Add(a3);
                context.SaveChanges();

                context.AuditResults.AddRange(
                    new AuditResult { AuditId = a3.AuditId, ItemName = "Container hàng thủy sản", ExpectedQty = 30, ActualQty = 30, Discrepancy = 0, RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-1) },
                    new AuditResult { AuditId = a3.AuditId, ItemName = "Pallet gỗ tiêu chuẩn",   ExpectedQty = 200, ActualQty = 195, Discrepancy = -5, DiscrepancyReason = "5 pallet bị hỏng, đã loại bỏ", RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-1) },
                    new AuditResult { AuditId = a3.AuditId, ItemName = "Thùng carton 60x40x40",  ExpectedQty = 500, ActualQty = 500, Discrepancy = 0, RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-1) }
                );
                context.SaveChanges();

                // Audit 4: COMPLETED — kho TP.HCM (owner2)
                var a4 = new AuditSession
                {
                    WarehouseId = warehouse3.WarehouseId,
                    CreatedBy   = ownerUser2.UserId,
                    Status      = "COMPLETED",
                    CreatedAt   = now.AddMonths(-1).AddDays(-10),
                    CompletedAt = now.AddMonths(-1).AddDays(-8),
                    Notes       = "Kiểm kê kho TP.HCM",
                };
                context.AuditSessions.Add(a4);
                context.SaveChanges();

                context.AuditResults.AddRange(
                    new AuditResult { AuditId = a4.AuditId, ItemName = "Gạo ST25 (bao 50kg)",  ExpectedQty = 400, ActualQty = 398, Discrepancy = -2, DiscrepancyReason = "2 bao bị rách", RecordedBy = ownerUser2.UserId, CreatedAt = now.AddMonths(-1).AddDays(-9) },
                    new AuditResult { AuditId = a4.AuditId, ItemName = "Nước mắm Phú Quốc 1L", ExpectedQty = 1000, ActualQty = 1000, Discrepancy = 0, RecordedBy = ownerUser2.UserId, CreatedAt = now.AddMonths(-1).AddDays(-9) },
                    new AuditResult { AuditId = a4.AuditId, ItemName = "Cà phê Trung Nguyên",  ExpectedQty = 300, ActualQty = 305, Discrepancy = 5, DiscrepancyReason = "Dư 5 thùng từ đơn hàng trả", RecordedBy = ownerUser2.UserId, CreatedAt = now.AddMonths(-1).AddDays(-9) }
                );
                context.SaveChanges();
            }

            var managerMembership = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == managerUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (managerMembership == null)
            {
                managerMembership = new WarehouseMembership
                {
                    UserId            = managerUser.UserId,
                    WarehouseId       = warehouse.WarehouseId,
                    WarehouseRoleId   = managerWhRole.Id,
                    WarehouseShiftId  = shiftNgay.Id,
                    IsActive          = true,
                    IsAllSkill        = true,   // Manager mặc định = toàn bộ skill
                    IsAllZone         = false,
                    CreatedAt         = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(managerMembership);
                context.SaveChanges();
            }

            // ══════════════════════════════════════════════════
            // 11. INVENTORY REQUESTS (nhập / xuất kho)
            // ══════════════════════════════════════════════════
            if (!context.InventoryRequests.Any())
            {
                var now = DateTime.UtcNow;

                // Inbound — renter nhập hàng vào kho 1 (confirmed)
                var ir1 = new InventoryRequest
                {
                    RenterId    = renterUser.UserId,
                    WarehouseId = warehouse.WarehouseId,
                    Type        = "INBOUND",
                    Status      = "CONFIRMED",
                    ConfirmedBy = staffUser.UserId,
                    ConfirmedAt = now.AddDays(-10),
                    CreatedAt   = now.AddDays(-12),
                    Notes       = "Nhập lô hàng điện tử mới",
                };
                context.InventoryRequests.Add(ir1);
                context.SaveChanges();
                context.InventoryItems.AddRange(
                    new InventoryItem { InvReqId = ir1.InvReqId, ItemName = "Laptop Dell XPS 15", Quantity = 50, Unit = "Chiếc", Weight = 100m, Description = "Laptop 15 inch" },
                    new InventoryItem { InvReqId = ir1.InvReqId, ItemName = "iPhone 15 Pro",      Quantity = 100, Unit = "Chiếc", Weight = 20m, Description = "Điện thoại iPhone" }
                );
                context.SaveChanges();

                // Outbound — renter xuất hàng từ kho 1 (confirmed)
                var ir2 = new InventoryRequest
                {
                    RenterId    = renterUser.UserId,
                    WarehouseId = warehouse.WarehouseId,
                    Type        = "OUTBOUND",
                    Status      = "CONFIRMED",
                    ConfirmedBy = staffUser.UserId,
                    ConfirmedAt = now.AddDays(-5),
                    CreatedAt   = now.AddDays(-7),
                    Notes       = "Xuất hàng giao đại lý Hà Nội",
                };
                context.InventoryRequests.Add(ir2);
                context.SaveChanges();
                context.InventoryItems.AddRange(
                    new InventoryItem { InvReqId = ir2.InvReqId, ItemName = "iPhone 15 Pro", Quantity = 30, Unit = "Chiếc", Weight = 6m, Description = "Giao cho đại lý Cầu Giấy" }
                );
                context.SaveChanges();

                // Inbound — renter2 nhập hàng vào kho 3 (pending)
                var ir3 = new InventoryRequest
                {
                    RenterId    = renterUser2.UserId,
                    WarehouseId = warehouse3.WarehouseId,
                    Type        = "INBOUND",
                    Status      = "PENDING",
                    CreatedAt   = now.AddDays(-2),
                    Notes       = "Nhập 200 thùng gạo ST25",
                };
                context.InventoryRequests.Add(ir3);
                context.SaveChanges();
                context.InventoryItems.AddRange(
                    new InventoryItem { InvReqId = ir3.InvReqId, ItemName = "Gạo ST25 (bao 50kg)", Quantity = 200, Unit = "Bao", Weight = 10000m, Description = "Gạo thơm Sóc Trăng" }
                );
                context.SaveChanges();

                // Outbound — renter xuất hàng từ kho 2 (pending)
                var ir4 = new InventoryRequest
                {
                    RenterId    = renterUser.UserId,
                    WarehouseId = warehouse2.WarehouseId,
                    Type        = "OUTBOUND",
                    Status      = "PENDING",
                    CreatedAt   = now.AddDays(-1),
                    Notes       = "Xuất container hàng thủy sản đi Nhật",
                };
                context.InventoryRequests.Add(ir4);
                context.SaveChanges();
                context.InventoryItems.AddRange(
                    new InventoryItem { InvReqId = ir4.InvReqId, ItemName = "Container tôm đông lạnh", Quantity = 5, Unit = "Container", Weight = 50000m, Description = "Xuất khẩu Nhật Bản" }
                );
                context.SaveChanges();
            }

            // ══════════════════════════════════════════════════
            // 12. WAREHOUSE TASKS
            // ══════════════════════════════════════════════════
            if (!context.WarehouseTasks.Any())
            {
                var ttIds = context.TaskTypes.ToDictionary(t => t.Code, t => t.Id);
                var zA  = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-A");
                var zB  = context.Zones.First(z => z.WarehouseId == warehouse.WarehouseId && z.Code == "Z-B");
                var zA2 = context.Zones.First(z => z.WarehouseId == warehouse2.WarehouseId && z.Code == "Z-A");

                var t1 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["GENERAL_CLEAN"], IsAllZone = true,  Status = "Pending",     ScheduledAt = new DateTime(2026,3,17,8,0,0,DateTimeKind.Utc),  Note = "Vệ sinh toàn bộ kho Hà Nội" };
                var t2 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["ZONE_INSPECT"],  IsAllZone = false, Status = "InProgress",  ScheduledAt = new DateTime(2026,3,15,7,30,0,DateTimeKind.Utc), Note = "Kiểm tra khu A và B" };
                var t3 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["INBOUND"],       IsAllZone = false, Status = "Pending",     ScheduledAt = new DateTime(2026,3,18,9,0,0,DateTimeKind.Utc),  Note = "Tiếp nhận lô hàng mới" };
                var t4 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["OUTBOUND"],      IsAllZone = false, Status = "Pending",     ScheduledAt = new DateTime(2026,3,19,10,0,0,DateTimeKind.Utc), Note = "Xuất hàng đơn #001" };
                var t5 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["AUDIT"],         IsAllZone = false, Status = "Pending",     ScheduledAt = new DateTime(2026,3,20,8,0,0,DateTimeKind.Utc),  Note = "Kiểm kê Zone B" };
                var t6 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["EQUIP_MAINT"],   IsAllZone = true,  Status = "Completed",   ScheduledAt = new DateTime(2026,3,16,8,0,0,DateTimeKind.Utc),  Note = "Bảo trì xe nâng" };
                var t7 = new WarehouseTask { WarehouseId = warehouse2.WarehouseId, TaskTypeId = ttIds["GENERAL_CLEAN"], IsAllZone = true,  Status = "Pending",     ScheduledAt = null, Note = "Vệ sinh kho Hải Phòng" };
                var t8 = new WarehouseTask { WarehouseId = warehouse.WarehouseId,  TaskTypeId = ttIds["OTHER"],         IsAllZone = true,  Status = "Pending",     ScheduledAt = null, Note = "Hỗ trợ đặc biệt theo yêu cầu" };

                context.WarehouseTasks.AddRange(t1, t2, t3, t4, t5, t6, t7, t8);
                context.SaveChanges();

                t2.Zones.Add(zA); t2.Zones.Add(zB);
                t3.Zones.Add(zA);
                t4.Zones.Add(zA);
                t5.Zones.Add(zB);
                context.SaveChanges();
            }
            // ─── 30 nhân viên STAFF cho Kho Hà Nội ─────────────────────────────────────
            // Skills chỉ gồm 3 giá trị chuẩn: CHECK_ORDER, PUTAWAY, INVENTORY_COUNT
            var allSkills = context.Skills.ToList();
            var skillMap  = allSkills.ToDictionary(s => s.Code, s => s);

            var thirtyStaff = new[]
            {
                // Nhân viên không có skill (general staff)
                ("Nguyễn Thị Hương",   "staff01@owrms.com", "0901000001", new string[]{}),
                ("Trần Văn Minh",      "staff02@owrms.com", "0901000002", new string[]{}),
                // Nhân viên CHECK_ORDER
                ("Lê Thị Lan",         "staff03@owrms.com", "0901000003", new[]{"CHECK_ORDER"}),
                ("Phạm Đức Thắng",     "staff04@owrms.com", "0901000004", new[]{"CHECK_ORDER"}),
                ("Hoàng Thị Thu",      "staff05@owrms.com", "0901000005", new[]{"CHECK_ORDER"}),
                // Nhân viên PUTAWAY
                ("Vũ Minh Tuấn",       "staff06@owrms.com", "0901000006", new[]{"PUTAWAY"}),
                ("Đặng Thị Nga",       "staff07@owrms.com", "0901000007", new[]{"PUTAWAY"}),
                ("Bùi Văn Hải",        "staff08@owrms.com", "0901000008", new[]{"PUTAWAY"}),
                // Nhân viên INVENTORY_COUNT
                ("Dương Thị Bích",     "staff09@owrms.com", "0901000009", new[]{"INVENTORY_COUNT"}),
                ("Ngô Văn Khánh",      "staff10@owrms.com", "0901000010", new[]{"INVENTORY_COUNT"}),
                ("Trịnh Thị Mai",      "staff11@owrms.com", "0901000011", new[]{"INVENTORY_COUNT"}),
                // Nhân viên CHECK_ORDER + PUTAWAY
                ("Đinh Văn Hùng",      "staff12@owrms.com", "0901000012", new[]{"CHECK_ORDER","PUTAWAY"}),
                ("Lý Thị Quỳnh",       "staff13@owrms.com", "0901000013", new[]{"CHECK_ORDER","PUTAWAY"}),
                ("Tăng Văn Phúc",      "staff14@owrms.com", "0901000014", new[]{"CHECK_ORDER","PUTAWAY"}),
                // Nhân viên CHECK_ORDER + INVENTORY_COUNT
                ("Cao Thị Hà",         "staff15@owrms.com", "0901000015", new[]{"CHECK_ORDER","INVENTORY_COUNT"}),
                ("Phan Văn Đạt",       "staff16@owrms.com", "0901000016", new[]{"CHECK_ORDER","INVENTORY_COUNT"}),
                ("Mai Thị Liên",       "staff17@owrms.com", "0901000017", new[]{"CHECK_ORDER","INVENTORY_COUNT"}),
                // Nhân viên PUTAWAY + INVENTORY_COUNT
                ("Lưu Văn Toàn",       "staff18@owrms.com", "0901000018", new[]{"PUTAWAY","INVENTORY_COUNT"}),
                ("Đỗ Thị Phượng",      "staff19@owrms.com", "0901000019", new[]{"PUTAWAY","INVENTORY_COUNT"}),
                ("Hồ Văn Long",        "staff20@owrms.com", "0901000020", new[]{"PUTAWAY","INVENTORY_COUNT"}),
                // Nhân viên toàn skill
                ("Từ Thị Nhung",       "staff21@owrms.com", "0901000021", new[]{"CHECK_ORDER","PUTAWAY","INVENTORY_COUNT"}),
                ("Trương Văn Bình",    "staff22@owrms.com", "0901000022", new[]{"CHECK_ORDER","PUTAWAY","INVENTORY_COUNT"}),
                ("Lâm Thị Kim",        "staff23@owrms.com", "0901000023", new[]{"CHECK_ORDER","PUTAWAY","INVENTORY_COUNT"}),
                // Mix
                ("Kiều Văn Sơn",       "staff24@owrms.com", "0901000024", new[]{"PUTAWAY"}),
                ("Tô Thị Diệu",        "staff25@owrms.com", "0901000025", new[]{"CHECK_ORDER"}),
                ("Ông Văn Thành",      "staff26@owrms.com", "0901000026", new[]{"INVENTORY_COUNT"}),
                ("Mạc Thị Hồng",       "staff27@owrms.com", "0901000027", new string[]{}),
                ("Ninh Văn Cường",     "staff28@owrms.com", "0901000028", new[]{"CHECK_ORDER","PUTAWAY"}),
                ("Châu Thị Xuân",      "staff29@owrms.com", "0901000029", new[]{"PUTAWAY","INVENTORY_COUNT"}),
                ("Quách Văn Nam",      "staff30@owrms.com", "0901000030", new[]{"CHECK_ORDER","INVENTORY_COUNT"}),
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
                var renterU = context.Users.FirstOrDefault(u => u.Email == email);
                if (renterU == null)
                {
                    renterU = new User
                    {
                        Email        = email,
                        FullName     = fullName,
                        PasswordHash = defaultPasswordHash,
                        RoleId       = userRoleId,
                        Status       = "ACTIVE",
                        Phone        = phone,
                        CreatedAt    = DateTime.UtcNow
                    };
                    context.Users.Add(renterU);
                    context.SaveChanges();
                }

                // Thêm membership RENTER cho warehouse 1
                if (!context.WarehouseMemberships.Any(m => m.UserId == renterU.UserId && m.WarehouseId == warehouse.WarehouseId))
                {
                    context.WarehouseMemberships.Add(new WarehouseMembership
                    {
                        UserId          = renterU.UserId,
                        WarehouseId     = warehouse.WarehouseId,
                        WarehouseRoleId = renterWhRole.Id,
                        IsActive        = true,
                        IsAllSkill      = false,
                        IsAllZone       = false,
                        CreatedAt       = DateTime.UtcNow
                    });
                }

                // Thêm membership RENTER cho warehouse 2
                if (!context.WarehouseMemberships.Any(m => m.UserId == renterU.UserId && m.WarehouseId == warehouse2.WarehouseId))
                {
                    context.WarehouseMemberships.Add(new WarehouseMembership
                    {
                        UserId          = renterU.UserId,
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

            // Seed RenterAssets + RenterInventory
            var r1 = context.Users.FirstOrDefault(u => u.Email == "renter1@owrms.com");
            var r2 = context.Users.FirstOrDefault(u => u.Email == "renter2@owrms.com");
            var r3 = context.Users.FirstOrDefault(u => u.Email == "renter3@owrms.com");
            var wh1 = context.Warehouses.FirstOrDefault(w => w.Name == "Kho Hà Nội");
            var wh2 = context.Warehouses.FirstOrDefault(w => w.Name == "Kho Hải Phòng");

            if (r1 != null && r2 != null && r3 != null && wh1 != null && wh2 != null)
            {
                void EnsureAsset(int renterId, string name, string unit, decimal? weight, string? desc,
                                 List<(int whId, int qty)> stocks)
                {
                    var asset = context.RenterAssets.FirstOrDefault(a => a.RenterId == renterId && a.AssetName == name);
                    if (asset == null)
                    {
                        asset = new RenterAsset
                        {
                            RenterId      = renterId,
                            AssetName     = name,
                            Unit          = unit,
                            WeightPerUnit = weight,
                            Description   = desc,
                            CreatedAt     = DateTime.UtcNow,
                        };
                        context.RenterAssets.Add(asset);
                        context.SaveChanges();
                    }

                    foreach (var (whId, qty) in stocks)
                    {
                        if (!context.RenterInventories.Any(i => i.AssetId == asset.AssetId && i.WarehouseId == whId))
                        {
                            context.RenterInventories.Add(new RenterInventory
                            {
                                AssetId     = asset.AssetId,
                                WarehouseId = whId,
                                Quantity    = qty,
                                UpdatedAt   = DateTime.UtcNow,
                            });
                        }
                    }
                    context.SaveChanges();
                }

                // renter1 — hàng tiêu dùng nhanh
                EnsureAsset(r1.UserId, "Mì tôm Hảo Hảo 75g",       "thùng", 1.5m,   "Mỳ tôm ăn liền",               new() { (wh1.WarehouseId, 320), (wh2.WarehouseId, 180) });
                EnsureAsset(r1.UserId, "Nước ngọt Pepsi 330ml",     "thùng", 7.2m,   "24 lon/thùng",                 new() { (wh1.WarehouseId, 150) });
                EnsureAsset(r1.UserId, "Dầu ăn Neptune 1L",         "thùng", 12.0m,  "12 chai/thùng",                new() { (wh1.WarehouseId, 90),  (wh2.WarehouseId, 60) });
                EnsureAsset(r1.UserId, "Sữa tươi TH True Milk 1L",  "thùng", 12.0m,  "12 hộp/thùng",                 new() { (wh2.WarehouseId, 200) });
                EnsureAsset(r1.UserId, "Bột giặt OMO 3kg",          "bao",   3.2m,   null,                           new() { (wh1.WarehouseId, 410) });

                // renter2 — vật liệu xây dựng & công nghiệp
                EnsureAsset(r2.UserId, "Xi măng Hà Tiên PCB40",     "bao",   50.0m,  "Bao 50kg",                     new() { (wh2.WarehouseId, 600), (wh1.WarehouseId, 200) });
                EnsureAsset(r2.UserId, "Sơn Nippon nội thất 5L",    "thùng", 6.5m,   "Sơn cao cấp nội thất",         new() { (wh2.WarehouseId, 120) });
                EnsureAsset(r2.UserId, "Ống nước PVC D60",          "cây",   2.8m,   "Ống dài 4m",                   new() { (wh2.WarehouseId, 300) });
                EnsureAsset(r2.UserId, "Gạch ốp lát 60x60",         "hộp",   20.0m,  "6 viên/hộp",                   new() { (wh1.WarehouseId, 80),  (wh2.WarehouseId, 250) });

                // renter3 — điện tử & phụ kiện
                EnsureAsset(r3.UserId, "Cáp HDMI 2.0 1.5m",         "cuộn",  0.15m,  "Hộp 50 sợi",                   new() { (wh1.WarehouseId, 40) });
                EnsureAsset(r3.UserId, "Bộ sạc nhanh USB-C 65W",    "cái",   0.22m,  null,                           new() { (wh1.WarehouseId, 110) });
                EnsureAsset(r3.UserId, "Ram DDR4 8GB 3200MHz",       "cái",   0.03m,  "Hãng Kingston",                new() { (wh1.WarehouseId, 75) });
                EnsureAsset(r3.UserId, "Ổ cứng SSD 256GB SATA",     "cái",   0.08m,  "Samsung 870 EVO",              new() { (wh1.WarehouseId, 55),  (wh2.WarehouseId, 30) });
                EnsureAsset(r3.UserId, "Tai nghe không dây Sony",    "cái",   0.25m,  "Model WH-1000XM5",             new() { (wh2.WarehouseId, 20) });
            }
        }

        // ──────────── Helper Methods ────────────

        private static User EnsureUser(ApplicationDbContext ctx, string email, string fullName, string passwordHash, int roleId, string phone)
        {
            var user = ctx.Users.FirstOrDefault(u => u.Email == email);
            if (user == null)
            {
                user = new User
                {
                    Email        = email,
                    FullName     = fullName,
                    PasswordHash = passwordHash,
                    RoleId       = roleId,
                    Status       = "ACTIVE",
                    Phone        = phone,
                    CreatedAt    = DateTime.UtcNow,
                };
                ctx.Users.Add(user);
                ctx.SaveChanges();
            }
            return user;
        }

        private static Warehouse EnsureWarehouse(ApplicationDbContext ctx, string name, string address,
            int ownerId, int approvedBy, double totalArea, double availableArea,
            double lat, double lng, string hours, string desc)
        {
            var wh = ctx.Warehouses.FirstOrDefault(w => w.Name == name);
            if (wh == null)
            {
                wh = new Warehouse
                {
                    Name           = name,
                    Address        = address,
                    OwnerId        = ownerId,
                    TotalArea      = totalArea,
                    AvailableArea  = availableArea,
                    Status         = "APPROVED",
                    Description    = desc,
                    Lat            = lat,
                    Lng            = lng,
                    OperatingHours = hours,
                    CreatedAt      = DateTime.UtcNow,
                    ApprovedAt     = DateTime.UtcNow,
                    ApprovedBy     = approvedBy,
                    HasZone        = true,
                };
                ctx.Warehouses.Add(wh);
                ctx.SaveChanges();
            }
            else if (!wh.HasZone)
            {
                wh.HasZone = true;
                ctx.SaveChanges();
            }
            return wh;
        }

        private static void EnsureZones(ApplicationDbContext ctx, int warehouseId, (string Code, string Name, string Desc)[] zones)
        {
            if (!ctx.Zones.Any(z => z.WarehouseId == warehouseId))
            {
                foreach (var (code, name, desc) in zones)
                    ctx.Zones.Add(new Zone { Code = code, Name = name, WarehouseId = warehouseId, Description = desc, IsActive = true, CreatedAt = DateTime.UtcNow });
                ctx.SaveChanges();
            }
        }

        private static WarehouseMembership EnsureMembership(ApplicationDbContext ctx, int userId, int warehouseId, int roleId, bool allSkill, bool allZone)
        {
            var m = ctx.WarehouseMemberships.FirstOrDefault(x => x.UserId == userId && x.WarehouseId == warehouseId);
            if (m == null)
            {
                m = new WarehouseMembership
                {
                    UserId          = userId,
                    WarehouseId     = warehouseId,
                    WarehouseRoleId = roleId,
                    IsActive        = true,
                    IsAllSkill      = allSkill,
                    IsAllZone       = allZone,
                    CreatedAt       = DateTime.UtcNow,
                };
                ctx.WarehouseMemberships.Add(m);
                ctx.SaveChanges();
            }
            return m;
        }
    }
}
