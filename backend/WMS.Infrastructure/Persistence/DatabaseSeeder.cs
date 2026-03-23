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

            // ══════════════════════════════════════════════════
            // 3. WAREHOUSES — 2 kho owner1, 1 kho owner2
            // ══════════════════════════════════════════════════
            var warehouse = EnsureWarehouse(context, "Kho Hà Nội",
                "123 Đường Giải Phóng, Hoàng Mai, Hà Nội",
                ownerUser.UserId, adminUser.UserId,
                5000, 3500, 20.9821, 105.8412, "08:00 - 18:00",
                "Kho tổng phân phối khu vực Hà Nội");

            var warehouse2 = EnsureWarehouse(context, "Kho Hải Phòng",
                "45 Đường Lạch Tray, Ngô Quyền, Hải Phòng",
                ownerUser.UserId, adminUser.UserId,
                3000, 2000, 20.8449, 106.6881, "07:00 - 17:00",
                "Kho khu vực Hải Phòng");

            var warehouse3 = EnsureWarehouse(context, "Kho TP.HCM",
                "789 Quốc Lộ 1A, Bình Tân, TP.HCM",
                ownerUser2.UserId, adminUser.UserId,
                8000, 6000, 10.7502, 106.6224, "06:00 - 22:00",
                "Kho lớn khu vực phía Nam");

            // ══════════════════════════════════════════════════
            // 4. ZONES
            // ══════════════════════════════════════════════════
            EnsureZones(context, warehouse.WarehouseId, new[]
            {
                ("Z-A", "Khu A - Thường",         "Khu vực lưu trữ hàng hóa chung"),
                ("Z-B", "Khu B - Lạnh",           "Khu vực lưu trữ hàng hóa lạnh"),
                ("Z-C", "Khu C - Hàng Nguy Hiểm", "Khu vực đặc biệt"),
            });
            EnsureZones(context, warehouse2.WarehouseId, new[]
            {
                ("Z-A", "Khu A - Cảng",      "Khu tiếp nhận container từ cảng"),
                ("Z-B", "Khu B - Khô",       "Khu lưu trữ hàng hóa khô"),
                ("Z-C", "Khu C - Lạnh",      "Khu lưu trữ hàng đông lạnh"),
                ("Z-D", "Khu D - Xuất khẩu", "Khu tập kết hàng chờ xuất khẩu"),
            });
            EnsureZones(context, warehouse3.WarehouseId, new[]
            {
                ("Z-A", "Khu A - Tổng hợp",   "Khu tổng hợp hàng hoá"),
                ("Z-B", "Khu B - Điện tử",    "Khu lưu trữ thiết bị điện tử"),
                ("Z-C", "Khu C - Thực phẩm",  "Khu lưu trữ thực phẩm"),
            });

            // ══════════════════════════════════════════════════
            // 5. SKILLS
            // ══════════════════════════════════════════════════
            var skillData = new[]
            {
                ("INBOUND",   "Nhận hàng"),
                ("PUTAWAY",   "Cất hàng vào vị trí"),
                ("PICKING",   "Lấy hàng"),
                ("PACKING",   "Đóng gói"),
                ("OUTBOUND",  "Xuất hàng"),
                ("INVENTORY", "Kiểm kê"),
                ("FORKLIFT",  "Vận hành xe nâng"),
            };
            foreach (var (code, name) in skillData)
            {
                if (!context.Skills.Any(s => s.Code == code))
                    context.Skills.Add(new Skill { Code = code, Name = name });
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

            // Link skill → task type
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
            if (ttInbound.SkillId  == null) ttInbound.SkillId  = skInbound?.Id;
            if (ttOutbound.SkillId == null) ttOutbound.SkillId = skOutbound?.Id;
            if (ttAudit.SkillId    == null) ttAudit.SkillId    = skInventory?.Id;
            if (ttEquip.SkillId    == null) ttEquip.SkillId    = skForklift?.Id;
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
