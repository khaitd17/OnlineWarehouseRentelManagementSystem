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
            // PATCH: Xoá unique index cũ (user_id, warehouse_id) nếu tồn tại
            // Index cũ ngăn 1 user có 2 role khác nhau trong cùng 1 kho (OWNER + OPERATOR)
            // EF Core đã define đúng: IX_warehouse_memberships_user_warehouse_role (user_id, warehouse_id, warehouse_role_id)
            // ══════════════════════════════════════════════════
            try
            {
                context.Database.ExecuteSqlRaw(@"
                    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_warehouse_memberships_user_id_warehouse_id' AND object_id = OBJECT_ID('warehouse_memberships'))
                    BEGIN
                        DROP INDEX IX_warehouse_memberships_user_id_warehouse_id ON warehouse_memberships;
                    END
                ");
            }
            catch { /* Bỏ qua nếu bảng chưa tồn tại */ }

            // ══════════════════════════════════════════════════
            // 0. SUBSCRIPTION PACKAGES
            // ══════════════════════════════════════════════════
            var packages = new[]
            {
                new SubscriptionPackage 
                { 
                    Name = "Basic", Price = 2000, Description = "Gói cơ bản: 1 kho, 3 nhân viên, 3 zones, 10.000 m²", 
                    DurationMonths = 1, MaxWarehouses = 1, MaxStaffPerWarehouse = 3, MaxZonesPerWarehouse = 3, MaxTotalArea = 10000, 
                    AllowEquipmentManagement = false, IsActive = true, CreatedAt = DateTime.UtcNow 
                },
                new SubscriptionPackage 
                { 
                    Name = "Premium", Price = 500000, Description = "Gói cao cấp: 8 kho, 20 nhân viên, 10 zones, 50.000 m², Quản lý thiết bị", 
                    DurationMonths = 1, MaxWarehouses = 8, MaxStaffPerWarehouse = 20, MaxZonesPerWarehouse = 10, MaxTotalArea = 50000, 
                    AllowEquipmentManagement = true, IsActive = true, CreatedAt = DateTime.UtcNow 
                }
            };
            foreach (var package in packages)
            {
                var existing = context.SubscriptionPackages.FirstOrDefault(p => p.Name == package.Name);
                if (existing == null)
                {
                    context.SubscriptionPackages.Add(package);
                }
                else
                {
                    // Update limits to latest values every startup
                    existing.MaxWarehouses = package.MaxWarehouses;
                    existing.MaxTotalArea  = package.MaxTotalArea;
                    existing.MaxStaffPerWarehouse  = package.MaxStaffPerWarehouse;
                    existing.MaxZonesPerWarehouse  = package.MaxZonesPerWarehouse;
                    existing.Description   = package.Description;
                }
            }
            context.SaveChanges();

            // ══════════════════════════════════════════════════
            // 1. SYSTEM ROLES — chỉ 2 loại: USER và ADMIN
            //    Mọi phân quyền liên quan đến kho đều dùng warehouse_roles (OWNER/MANAGER/OPERATOR/STAFF/RENTER)
            // ══════════════════════════════════════════════════
            var systemRoles = new[]
            {
                new Role { RoleName = "USER",  Description = "Người dùng thường" },
                new Role { RoleName = "ADMIN", Description = "Quản trị viên hệ thống" },
            };
            foreach (var role in systemRoles)
            {
                if (!context.Roles.Any(r => r.RoleName == role.RoleName))
                    context.Roles.Add(role);
            }
            context.SaveChanges();

            var adminRoleId = context.Roles.First(r => r.RoleName == "ADMIN").RoleId;
            var userRoleId  = context.Roles.First(r => r.RoleName == "USER").RoleId;

            // ── Migration: cập nhật các user có system role sai (OWNER/RENTER/STAFF/MANAGER → USER) ──
            var legacyRoleNames = new[] { "OWNER", "RENTER", "STAFF", "MANAGER" };
            var legacyRoleIds = context.Roles
                .Where(r => legacyRoleNames.Contains(r.RoleName))
                .Select(r => r.RoleId)
                .ToList();
            if (legacyRoleIds.Any())
            {
                var usersToMigrate = context.Users
                    .Where(u => legacyRoleIds.Contains(u.RoleId))
                    .ToList();
                foreach (var u in usersToMigrate)
                    u.RoleId = userRoleId;
                context.SaveChanges();
                var rolesToDelete = context.Roles
                    .Where(r => legacyRoleNames.Contains(r.RoleName))
                    .ToList();
                context.Roles.RemoveRange(rolesToDelete);
                context.SaveChanges();
            }

            string defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("123456");
            string pw = defaultPasswordHash;

            // ══════════════════════════════════════════════════
            // 2. USERS — đủ mỗi role, password: 123456
            // ══════════════════════════════════════════════════
            // ── Tài khoản hệ thống chính ──────────────────────────────────────────
            // Tất cả user đều là USER ở system level — phân quyền kho qua warehouse_memberships
            var adminUser   = EnsureUser(context, "admin@owrms.com",     "Nguyễn Minh Quản Trị",  pw, adminRoleId,  "0900000001");
            var ownerUser   = EnsureUser(context, "trandinhkhai09072003@gmail.com", "Trần Đình Khải", pw, userRoleId, "0900000002");
            var renterUser  = EnsureUser(context, "renter@owrms.com",    "Lê Văn Đạt",             pw, userRoleId,   "0900000004");
            var renterUser2 = EnsureUser(context, "renter2@owrms.com",   "Ngô Thị Thu",            pw, userRoleId,   "0900000005");
            var managerUser = EnsureUser(context, "ndgiap2004@gmail.com", "Đỗ Minh Khoa", pw, userRoleId, "0900000008");
            // Nhân viên kho — system role = USER, warehouse role trong membership
            var checkerUser   = EnsureUser(context, "checker@owrms.com",   "Nguyễn Thị Lan",    pw, userRoleId, "0900000010");
            var inventoryUser = EnsureUser(context, "inventory@owrms.com", "Phạm Văn Tuấn",     pw, userRoleId, "0900000011");
            var workerUser    = EnsureUser(context, "worker@owrms.com",    "Hoàng Thị Mai",     pw, userRoleId, "0900000012");
            var allSkillUser  = EnsureUser(context, "allskill@owrms.com",  "Lý Văn Toàn Năng",  pw, userRoleId, "0900000013");
            var staffUser  = EnsureUser(context, "Phanhoangbao59@gmail.com", "Nguyễn Văn Phúc", pw, userRoleId, "0900000006");
            var staffUser2 = EnsureUser(context, "staff2@owrms.com", "Hoàng Văn Dũng",   pw, userRoleId, "0900000007");
            context.SaveChanges();

            // ── Chỉ 1 kho chính: Kho Hà Nội ──────────────────────────────────────
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

            // Đảm bảo warehouse2/warehouse3 tồn tại trong DB
            var warehouse2 = EnsureWarehouse(context, "Kho Hải Phòng", "456 Đường Lê Hồng Phong, Hải Phòng", 
                ownerUser.UserId, adminUser.UserId, 3000, 3000, 20.8449, 106.6881, "08:00 - 17:00", "Kho trung chuyển khu vực Cảng Hải Phòng");
            
            var warehouse3 = EnsureWarehouse(context, "Kho TP.HCM", "789 Đường Mai Chí Thọ, Quận 2, TP.HCM", 
                ownerUser.UserId, adminUser.UserId, 8000, 8000, 10.7817, 106.7273, "24/7", "Kho tổng quy mô lớn tại miền Nam");

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

            // Skills = loại nhân viên theo chức năng (3 loại chuẩn)
            var skills = new[]
            {
                new Skill { Code = "CHECKER",            Name = "Kiểm tra / Nhận & Xuất hàng" },
                new Skill { Code = "INVENTORY_OPERATOR", Name = "Vận hành kho (Vị trí & Kiểm kê)" },
                new Skill { Code = "WAREHOUSE_WORKER",   Name = "Nhân viên phổ thông" }
            };
            // Xoá skill cũ nếu còn tồn tại (migration từ 7 skills → 3 skills)
            var oldCodes = new[] { "INBOUND", "PUTAWAY", "PICKING", "PACKING", "OUTBOUND", "INVENTORY", "FORKLIFT", "CHECK_ORDER", "INVENTORY_COUNT" };
            var oldSkillIds = context.Skills.Where(s => oldCodes.Contains(s.Code)).Select(s => s.Id).ToList();
            if (oldSkillIds.Any())
            {
                // Xoá join table rows trước để tránh FK violation (DeleteBehavior.NoAction)
                var idList = string.Join(",", oldSkillIds);
                context.Database.ExecuteSqlRaw($"DELETE FROM warehouse_membership_skills WHERE skill_id IN ({idList})");
                context.Database.ExecuteSqlRaw($"UPDATE task_types SET skill_id = NULL WHERE skill_id IN ({idList})");
                foreach (var old in context.Skills.Where(s => oldCodes.Contains(s.Code)).ToList())
                    context.Skills.Remove(old);
                context.SaveChanges();
            }
            foreach (var skill in skills)
            {
                if (!context.Skills.Any(s => s.Code == skill.Code))
                    context.Skills.Add(skill);
            }
            context.SaveChanges();

            // ══════════════════════════════════════════════════
            // 6. TASK TYPES
            // ══════════════════════════════════════════════════
            var taskTypeData = new (string Code, string Name, string Desc, bool AllSkill, bool IsManual)[]
            {
                ("INBOUND",       "Nhập kho",          "Tiếp nhận hàng hoá vào kho",             false, false),
                ("OUTBOUND",      "Xuất kho",          "Xuất hàng hoá ra khỏi kho",              false, false),
                ("AUDIT",         "Kiểm kê định kỳ",   "Đếm và đối chiếu tồn kho",              false, false),
                ("EQUIP_MAINT",   "Bảo trì thiết bị",  "Bảo dưỡng và sửa chữa thiết bị kho",    false,  true),
                ("GENERAL_CLEAN", "Vệ sinh kho",       "Vệ sinh toàn bộ hoặc khu vực kho",        true,  true),
                ("ZONE_INSPECT",  "Kiểm tra khu vực",  "Tuần tra và kiểm tra tình trạng zone",    true,  true),
                ("OTHER",         "Khác",              "Task tổng quát",                           true,  true),
            };
            foreach (var tt in taskTypeData)
            {
                var existing = context.TaskTypes.FirstOrDefault(t => t.Code == tt.Code);
                if (existing == null)
                    context.TaskTypes.Add(new TaskType { Code = tt.Code, Name = tt.Name, Description = tt.Desc, IsAllSkill = tt.AllSkill, IsManual = tt.IsManual });
                else if (existing.IsManual != tt.IsManual)
                    existing.IsManual = tt.IsManual; // migrate DB cũ
            }
            context.SaveChanges();

            var skChecker   = context.Skills.FirstOrDefault(s => s.Code == "CHECKER");
            var skInvOp     = context.Skills.FirstOrDefault(s => s.Code == "INVENTORY_OPERATOR");
            var skWwWorker  = context.Skills.FirstOrDefault(s => s.Code == "WAREHOUSE_WORKER");

            var ttInbound  = context.TaskTypes.First(t => t.Code == "INBOUND");
            var ttOutbound = context.TaskTypes.First(t => t.Code == "OUTBOUND");
            var ttAudit    = context.TaskTypes.First(t => t.Code == "AUDIT");
            var ttEquip    = context.TaskTypes.First(t => t.Code == "EQUIP_MAINT");

            if (ttInbound.SkillId  == null) { ttInbound.SkillId  = skChecker?.Id; }
            if (ttOutbound.SkillId == null) { ttOutbound.SkillId = skChecker?.Id; }
            if (ttAudit.SkillId    == null) { ttAudit.SkillId    = skInvOp?.Id; }
            if (ttEquip.SkillId    == null) { ttEquip.SkillId    = skWwWorker?.Id; }
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
            var checkerSkill      = context.Skills.FirstOrDefault(s => s.Code == "CHECKER");
            var invOpSkill        = context.Skills.FirstOrDefault(s => s.Code == "INVENTORY_OPERATOR");
            var wwSkill           = context.Skills.FirstOrDefault(s => s.Code == "WAREHOUSE_WORKER");
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
            // Owner → OWNER membership (thương mại) — CreateWarehouseHandler cũng tạo OPERATOR, đây chỉ là seed fallback
            EnsureMembership(context, ownerUser.UserId, warehouse.WarehouseId, ownerWhRole.Id,    true, true);
            EnsureMembership(context, ownerUser.UserId, warehouse.WarehouseId, operatorWhRole.Id, true, true);

            // Renter → RENTER membership (để CreateAuditSession và các permission check qua GetCallerMembershipAsync)
            EnsureMembership(context, renterUser.UserId,  warehouse.WarehouseId, renterWhRole.Id, false, false);
            EnsureMembership(context, renterUser2.UserId, warehouse.WarehouseId, renterWhRole.Id, false, false);

            // Staff → STAFF membership (skill + zone cụ thể)
            var staffMembership = EnsureMembership(context, staffUser.UserId, warehouse.WarehouseId, staffWhRole.Id, false, false);
            // Eagerly load collections to check existence
            context.Entry(staffMembership).Collection(m => m.Skills).Load();
            context.Entry(staffMembership).Collection(m => m.Zones).Load();
            if (!staffMembership.Skills.Any())
            {
                if (checkerSkill != null) staffMembership.Skills.Add(checkerSkill);
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

            // Manager → MANAGER membership trong warehouse 1
            EnsureMembership(context, managerUser.UserId, warehouse.WarehouseId, managerWhRole.Id, true, true);

            // Owner → OWNER + OPERATOR membership cho warehouse 2 (Hải Phòng) và warehouse 3 (TP.HCM)
            // Thiếu memberships này sẽ khiến owner không thấy kho 2/3 trong context → không hiển thị được schedule
            if (warehouse2 != null)
            {
                EnsureMembership(context, ownerUser.UserId, warehouse2.WarehouseId, ownerWhRole.Id,    true, true);
                EnsureMembership(context, ownerUser.UserId, warehouse2.WarehouseId, operatorWhRole.Id, true, true);
            }
            if (warehouse3 != null)
            {
                EnsureMembership(context, ownerUser.UserId, warehouse3.WarehouseId, ownerWhRole.Id,    true, true);
                EnsureMembership(context, ownerUser.UserId, warehouse3.WarehouseId, operatorWhRole.Id, true, true);
            }

            // ─── Tạo 7 Kho Hàng Ảo Tại Hà Nội Cho Tài Khoản Trandinhkhai ───
            var hanoiMockWarehouses = new[]
            {
                new { Name = "Kho Long Biên - KCN Sài Đồng", Address = "Ngõ 163 Tư Đình, Long Biên, Hà Nội", TotalArea = 2000.0, Lat = 21.0336, Lng = 105.8829, Desc = "Kho sạch sẽ, thoáng mát, thuận tiện xe tải lớn ra vào, giá cả hợp lý. Phù hợp làm kho trung chuyển.", Price = 75000m },
                new { Name = "Kho Công Nghiệp Ngọc Hồi", Address = "KCN Ngọc Hồi, Thanh Trì, Hà Nội", TotalArea = 4000.0, Lat = 20.9234, Lng = 105.8451, Desc = "Kho xưởng cao ráo, tiêu chuẩn công nghiệp, phù hợp chứa máy móc, vật liệu xây dựng. Có bảo vệ 24/7.", Price = 60000m },
                new { Name = "Kho Trung Tâm Cầu Giấy", Address = "Dịch Vọng, Cầu Giấy, Hà Nội", TotalArea = 1500.0, Lat = 21.0360, Lng = 105.7950, Desc = "Kho trung tâm thành phố, tiện phân phối hàng hóa tiêu dùng, mỹ phẩm. An ninh 24/7, có sẵn camera.", Price = 120000m },
                new { Name = "Kho Tổng Đông Anh", Address = "Đường Trường Sa, Đông Anh, Hà Nội", TotalArea = 6000.0, Lat = 21.1147, Lng = 105.8361, Desc = "Kho tổng quy mô cực lớn, sát đường quốc lộ, xe container ra vào thoải mái. Diện tích sân bãi rộng rãi.", Price = 50000m },
                new { Name = "Kho Lạnh Nam Từ Liêm", Address = "Tây Mỗ, Nam Từ Liêm, Hà Nội", TotalArea = 2500.0, Lat = 21.0089, Lng = 105.7483, Desc = "Kho mát, đạt chuẩn bảo quản thực phẩm, hàng tiêu dùng, có trang bị hệ thống PCCC, nền Epoxy chuẩn.", Price = 90000m },
                new { Name = "Kho Lưu Trữ Hà Đông", Address = "Phú Lãm, Hà Đông, Hà Nội", TotalArea = 3000.0, Lat = 20.9419, Lng = 105.7533, Desc = "Kho thoáng mát, thích hợp làm xưởng sản xuất nhẹ hoặc lưu trữ hàng nội thất, điện máy.", Price = 65000m },
                new { Name = "Kho Nông Sản Gia Lâm", Address = "Trâu Quỳ, Gia Lâm, Hà Nội", TotalArea = 5000.0, Lat = 21.0200, Lng = 105.9320, Desc = "Kho bãi rộng, có dịch vụ nâng hạ, bốc xếp, phù hợp hàng nông sản, phân bón, vật liệu nặng.", Price = 55000m }
            };

            foreach (var whData in hanoiMockWarehouses)
            {
                var newWh = EnsureWarehouse(context, whData.Name, whData.Address, ownerUser.UserId, adminUser.UserId, whData.TotalArea, whData.TotalArea, whData.Lat, whData.Lng, "08:00 - 18:00", whData.Desc);
                if (newWh.PricePerM2 != whData.Price)
                {
                    newWh.PricePerM2 = whData.Price;
                    context.SaveChanges();
                }
                EnsureMembership(context, ownerUser.UserId, newWh.WarehouseId, ownerWhRole.Id, true, true);
                EnsureMembership(context, ownerUser.UserId, newWh.WarehouseId, operatorWhRole.Id, true, true);
                
                if (!context.WarehouseMedia.Any(i => i.WarehouseId == newWh.WarehouseId))
                {
                    context.WarehouseMedia.AddRange(
                        new WarehouseMedium { WarehouseId = newWh.WarehouseId, MediaUrl = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop", MediaType = "IMAGE", IsPrimary = true, DisplayOrder = 1, CreatedAt = DateTime.UtcNow },
                        new WarehouseMedium { WarehouseId = newWh.WarehouseId, MediaUrl = "https://images.unsplash.com/photo-1565891741441-64926e441838?q=80&w=2071&auto=format&fit=crop", MediaType = "IMAGE", IsPrimary = false, DisplayOrder = 2, CreatedAt = DateTime.UtcNow },
                        new WarehouseMedium { WarehouseId = newWh.WarehouseId, MediaUrl = "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2070&auto=format&fit=crop", MediaType = "IMAGE", IsPrimary = false, DisplayOrder = 3, CreatedAt = DateTime.UtcNow }
                    );
                    context.SaveChanges();
                }
            }

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

                // RentalRequest 2: renter2 xin thuê kho 1 (pending)
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


            // ── Membership operator1@owrms.com: giữ nếu đã tồn tại trong DB cũ (không tạo mới)
            var operatorUser = context.Users.FirstOrDefault(u => u.Email == "operator1@owrms.com");
            if (operatorUser != null)
                EnsureMembership(context, operatorUser.UserId, warehouse.WarehouseId, operatorWhRole.Id, true, true);

            // staff@owrms.com → STAFF membership trong warehouse 1 (skill CHECKER)
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
                if (checkerSkill != null) membership.Skills.Add(checkerSkill);
                context.WarehouseMemberships.Add(membership);
                context.SaveChanges();
            }

            // checker@owrms.com → STAFF + skill CHECKER
            var checkerMem = context.WarehouseMemberships
                .Include(m => m.Skills)
                .FirstOrDefault(m => m.UserId == checkerUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (checkerMem == null)
            {
                checkerMem = new WarehouseMembership
                {
                    UserId            = checkerUser.UserId,
                    WarehouseId       = warehouse.WarehouseId,
                    WarehouseRoleId   = staffWhRole.Id,
                    WarehouseShiftId  = shiftSang.Id,
                    IsActive          = true,
                    IsAllSkill        = false,
                    CreatedAt         = DateTime.UtcNow
                };
                if (checkerSkill != null) checkerMem.Skills.Add(checkerSkill);
                context.WarehouseMemberships.Add(checkerMem);
                context.SaveChanges();
            }

            // inventory@owrms.com → STAFF + skill INVENTORY_OPERATOR
            var inventoryMem = context.WarehouseMemberships
                .Include(m => m.Skills)
                .FirstOrDefault(m => m.UserId == inventoryUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (inventoryMem == null)
            {
                inventoryMem = new WarehouseMembership
                {
                    UserId            = inventoryUser.UserId,
                    WarehouseId       = warehouse.WarehouseId,
                    WarehouseRoleId   = staffWhRole.Id,
                    WarehouseShiftId  = shiftSang.Id,
                    IsActive          = true,
                    IsAllSkill        = false,
                    CreatedAt         = DateTime.UtcNow
                };
                if (invOpSkill != null) inventoryMem.Skills.Add(invOpSkill);
                context.WarehouseMemberships.Add(inventoryMem);
                context.SaveChanges();
            }

            // worker@owrms.com → STAFF + skill WAREHOUSE_WORKER
            var workerMem = context.WarehouseMemberships
                .Include(m => m.Skills)
                .FirstOrDefault(m => m.UserId == workerUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (workerMem == null)
            {
                workerMem = new WarehouseMembership
                {
                    UserId            = workerUser.UserId,
                    WarehouseId       = warehouse.WarehouseId,
                    WarehouseRoleId   = staffWhRole.Id,
                    WarehouseShiftId  = shiftSang.Id,
                    IsActive          = true,
                    IsAllSkill        = false,
                    CreatedAt         = DateTime.UtcNow
                };
                if (wwSkill != null) workerMem.Skills.Add(wwSkill);
                context.WarehouseMemberships.Add(workerMem);
                context.SaveChanges();
            }

            // allskill@owrms.com → STAFF + IsAllSkill = true (nhân viên toàn năng)
            var allSkillMem = context.WarehouseMemberships
                .FirstOrDefault(m => m.UserId == allSkillUser.UserId && m.WarehouseId == warehouse.WarehouseId);
            if (allSkillMem == null)
            {
                allSkillMem = new WarehouseMembership
                {
                    UserId           = allSkillUser.UserId,
                    WarehouseId      = warehouse.WarehouseId,
                    WarehouseRoleId  = staffWhRole.Id,
                    WarehouseShiftId = shiftNgay.Id,
                    IsActive         = true,
                    IsAllSkill       = true,   // toàn năng
                    CreatedAt        = DateTime.UtcNow
                };
                context.WarehouseMemberships.Add(allSkillMem);
                context.SaveChanges();
            }

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

                // Audit 4 (kho TP.HCM) — chỉ seed nếu warehouse3 tồn tại trong DB cũ
                var w3 = context.Warehouses.FirstOrDefault(w => w.Name == "Kho TP.HCM");
                if (w3 != null)
                {
                    var a4 = new AuditSession
                    {
                        WarehouseId = w3.WarehouseId,
                        CreatedBy   = ownerUser.UserId,
                        Status      = "COMPLETED",
                        CreatedAt   = now.AddMonths(-1).AddDays(-10),
                        CompletedAt = now.AddMonths(-1).AddDays(-8),
                        Notes       = "Kiểm kê kho TP.HCM",
                    };
                    context.AuditSessions.Add(a4);
                    context.SaveChanges();

                    context.AuditResults.AddRange(
                        new AuditResult { AuditId = a4.AuditId, ItemName = "Gạo ST25 (bao 50kg)",  ExpectedQty = 400, ActualQty = 398, Discrepancy = -2, DiscrepancyReason = "2 bao bị rách", RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-1).AddDays(-9) },
                        new AuditResult { AuditId = a4.AuditId, ItemName = "Nước mắm Phú Quốc 1L", ExpectedQty = 1000, ActualQty = 1000, Discrepancy = 0, RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-1).AddDays(-9) },
                        new AuditResult { AuditId = a4.AuditId, ItemName = "Cà phê Trung Nguyên",  ExpectedQty = 300, ActualQty = 305, Discrepancy = 5, DiscrepancyReason = "Dư 5 thùng từ đơn hàng trả", RecordedBy = ownerUser.UserId, CreatedAt = now.AddMonths(-1).AddDays(-9) }
                    );
                    context.SaveChanges();
                }
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

                // Inbound — renter2 nhập hàng vào kho 3 (pending) — chỉ seed nếu warehouse3 tồn tại
                if (warehouse3 != null)
                {
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
                }

                // Outbound — renter xuất hàng từ kho 2 (pending) — chỉ seed nếu warehouse2 tồn tại
                if (warehouse2 != null)
                {
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
            }

            // ══════════════════════════════════════════════════
            // 12. WAREHOUSE TASKS
            // ══════════════════════════════════════════════════
            if (!context.WarehouseTasks.Any())
            {
                var ttIds = context.TaskTypes.ToDictionary(t => t.Code, t => t.Id);

                var t1 = new WarehouseTask { WarehouseId = warehouse.WarehouseId, TaskTypeId = ttIds["GENERAL_CLEAN"], Status = "Pending", ScheduledAt = new DateTime(2026,3,17,8,0,0,DateTimeKind.Utc),  Note = "Vệ sinh toàn bộ kho Hà Nội" };
                var t2 = new WarehouseTask { WarehouseId = warehouse.WarehouseId, TaskTypeId = ttIds["ZONE_INSPECT"],  Status = "Pending", ScheduledAt = new DateTime(2026,3,15,7,30,0,DateTimeKind.Utc), Note = "Kiểm tra khu A và B" };
                var t3 = new WarehouseTask { WarehouseId = warehouse.WarehouseId, TaskTypeId = ttIds["EQUIP_MAINT"],  Status = "Done",    ScheduledAt = new DateTime(2026,3,16,8,0,0,DateTimeKind.Utc),  Note = "Bảo trì xe nâng" };
                var t4 = new WarehouseTask { WarehouseId = warehouse.WarehouseId, TaskTypeId = ttIds["GENERAL_CLEAN"], Status = "Pending", ScheduledAt = null, Note = "Vệ sinh khu B" };
                var t5 = new WarehouseTask { WarehouseId = warehouse.WarehouseId, TaskTypeId = ttIds["GENERAL_CLEAN"], Status = "Pending", ScheduledAt = null, Note = "Vệ sinh khu C" };
                var t6 = new WarehouseTask { WarehouseId = warehouse.WarehouseId, TaskTypeId = ttIds["OTHER"],         Status = "Pending", ScheduledAt = null, Note = "Hỗ trợ đặc biệt theo yêu cầu" };

                context.WarehouseTasks.AddRange(t1, t2, t3, t4, t5, t6);
                context.SaveChanges();

            }
            // ─── 30 nhân viên STAFF cho Kho Hà Nội ─────────────────────────────────────
            // Skills: CHECKER, INVENTORY_OPERATOR, WAREHOUSE_WORKER
            var allSkills = context.Skills.ToList();
            var skillMap  = allSkills.ToDictionary(s => s.Code, s => s);

            var thirtyStaff = new[]
            {
                // Nhân viên không có skill (phổ thông)
                ("Nguyễn Thị Hương",   "staff01@owrms.com", "0901000001", new[]{"WAREHOUSE_WORKER"}),
                ("Trần Văn Minh",      "staff02@owrms.com", "0901000002", new[]{"WAREHOUSE_WORKER"}),
                // Checker (Inbound / Outbound)
                ("Lê Thị Lan",         "staff03@owrms.com", "0901000003", new[]{"CHECKER"}),
                ("Phạm Đức Thắng",     "staff04@owrms.com", "0901000004", new[]{"CHECKER"}),
                ("Hoàng Thị Thu",      "staff05@owrms.com", "0901000005", new[]{"CHECKER"}),
                // Inventory Operator (Vị trí & Kiểm kê)
                ("Vũ Minh Tuấn",       "staff06@owrms.com", "0901000006", new[]{"INVENTORY_OPERATOR"}),
                ("Đặng Thị Nga",       "staff07@owrms.com", "0901000007", new[]{"INVENTORY_OPERATOR"}),
                ("Bùi Văn Hải",        "staff08@owrms.com", "0901000008", new[]{"INVENTORY_OPERATOR"}),
                // Warehouse Worker
                ("Dương Thị Bích",     "staff09@owrms.com", "0901000009", new[]{"WAREHOUSE_WORKER"}),
                ("Ngô Văn Khánh",      "staff10@owrms.com", "0901000010", new[]{"WAREHOUSE_WORKER"}),
                ("Trịnh Thị Mai",      "staff11@owrms.com", "0901000011", new[]{"WAREHOUSE_WORKER"}),
                // Checker + Inventory Operator
                ("Đinh Văn Hùng",      "staff12@owrms.com", "0901000012", new[]{"CHECKER","INVENTORY_OPERATOR"}),
                ("Lý Thị Quỳnh",       "staff13@owrms.com", "0901000013", new[]{"CHECKER","INVENTORY_OPERATOR"}),
                ("Tăng Văn Phúc",      "staff14@owrms.com", "0901000014", new[]{"CHECKER","INVENTORY_OPERATOR"}),
                // Checker + Warehouse Worker
                ("Cao Thị Hà",         "staff15@owrms.com", "0901000015", new[]{"CHECKER","WAREHOUSE_WORKER"}),
                ("Phan Văn Đạt",       "staff16@owrms.com", "0901000016", new[]{"CHECKER","WAREHOUSE_WORKER"}),
                ("Mai Thị Liên",       "staff17@owrms.com", "0901000017", new[]{"CHECKER","WAREHOUSE_WORKER"}),
                // Inventory Operator + Warehouse Worker
                ("Lưu Văn Toàn",       "staff18@owrms.com", "0901000018", new[]{"INVENTORY_OPERATOR","WAREHOUSE_WORKER"}),
                ("Đỗ Thị Phượng",      "staff19@owrms.com", "0901000019", new[]{"INVENTORY_OPERATOR","WAREHOUSE_WORKER"}),
                ("Hồ Văn Long",        "staff20@owrms.com", "0901000020", new[]{"INVENTORY_OPERATOR","WAREHOUSE_WORKER"}),
                // Toàn bộ
                ("Từ Thị Nhung",       "staff21@owrms.com", "0901000021", new[]{"CHECKER","INVENTORY_OPERATOR","WAREHOUSE_WORKER"}),
                ("Trương Văn Bình",    "staff22@owrms.com", "0901000022", new[]{"CHECKER","INVENTORY_OPERATOR","WAREHOUSE_WORKER"}),
                ("Lâm Thị Kim",        "staff23@owrms.com", "0901000023", new[]{"CHECKER","INVENTORY_OPERATOR","WAREHOUSE_WORKER"}),
                // Mix
                ("Kiều Văn Sơn",       "staff24@owrms.com", "0901000024", new[]{"INVENTORY_OPERATOR"}),
                ("Tô Thị Diệu",        "staff25@owrms.com", "0901000025", new[]{"CHECKER"}),
                ("Ông Văn Thành",      "staff26@owrms.com", "0901000026", new[]{"WAREHOUSE_WORKER"}),
                ("Mạc Thị Hồng",       "staff27@owrms.com", "0901000027", new[]{"WAREHOUSE_WORKER"}),
                ("Ninh Văn Cường",     "staff28@owrms.com", "0901000028", new[]{"CHECKER","INVENTORY_OPERATOR"}),
                ("Châu Thị Xuân",      "staff29@owrms.com", "0901000029", new[]{"INVENTORY_OPERATOR","WAREHOUSE_WORKER"}),
                ("Quách Văn Nam",      "staff30@owrms.com", "0901000030", new[]{"CHECKER","WAREHOUSE_WORKER"}),
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

                // Chỉ thêm membership RENTER cho warehouse 1 (kho Hà Nội)
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

            // Seed tài sản và tồn kho demo cho Renter
            SeedRenterInventory(context);

            // ══════════════════════════════════════════════════
            // 13. SUBSCRIPTION CHO OWNER — gói Premium đang active
            // ══════════════════════════════════════════════════
            var ownerSub = context.Subscriptions
                .FirstOrDefault(s => s.UserId == ownerUser.UserId && s.Status == SubscriptionStatus.Active);
            if (ownerSub == null)
            {
                var subStart = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                var subEnd   = subStart.AddMonths(12); // gia hạn sẵn 1 năm (Premium)
                context.Subscriptions.Add(new Subscription
                {
                    UserId               = ownerUser.UserId,
                    Plan                 = "Premium",
                    Status               = SubscriptionStatus.Active,
                    StartDate            = subStart,
                    EndDate              = subEnd,
                    TransactionReference = "SEED-OWNER-PREMIUM-2026",
                });
                context.SaveChanges();
            }

            // ── Cập nhật toàn bộ diện tích kho của ownerUser < 1000m2 (không trùng lặp) ──
            var ownerWarehouses = context.Warehouses.Where(w => w.OwnerId == ownerUser.UserId).ToList();
            var randArea = new Random(123);
            var usedAreas = new System.Collections.Generic.HashSet<double>();
            foreach (var w in ownerWarehouses)
            {
                double newArea;
                do
                {
                    newArea = randArea.Next(30, 99) * 10; // 300, 310, ..., 980
                } while (usedAreas.Contains(newArea));
                
                usedAreas.Add(newArea);
                w.TotalArea = newArea;
                w.AvailableArea = newArea; // Reset available area for test account
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
            // 1 user có thể có nhiều roles trong cùng 1 kho (VD: OWNER + OPERATOR)
            // Query theo cả roleId để không bị skip khi gọi lần 2 với role khác
            var m = ctx.WarehouseMemberships
                .FirstOrDefault(x => x.UserId == userId && x.WarehouseId == warehouseId && x.WarehouseRoleId == roleId);
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

        // ══════════════════════════════════════════════════════════════
        // SEED RENTER ASSETS + INVENTORY (idempotent — Ensure từng record)
        // ══════════════════════════════════════════════════════════════
        private static void SeedRenterInventory(ApplicationDbContext ctx)
        {
            var renter1 = ctx.Users.FirstOrDefault(u => u.Email == "renter@owrms.com");
            var renter2 = ctx.Users.FirstOrDefault(u => u.Email == "renter2@owrms.com");
            var wh1     = ctx.Warehouses.FirstOrDefault(w => w.Name == "Kho Hà Nội");
            var wh2     = ctx.Warehouses.FirstOrDefault(w => w.Name == "Kho Hải Phòng");

            if (renter1 == null || wh1 == null) return;

            // ── Ensure asset của renter1 + inventory ─────────────────
            var laptop  = EnsureAsset(ctx, renter1.UserId, "Laptop Dell XPS 15",   "chiếc",  1.8m,  "Laptop cao cấp, dùng cho văn phòng");
            var phone   = EnsureAsset(ctx, renter1.UserId, "iPhone 15 Pro",         "chiếc",  0.2m,  "Điện thoại mới nhất");
            var monitor = EnsureAsset(ctx, renter1.UserId, "Màn hình LG 27 inch",   "chiếc",  5.0m,  "Màn hình 4K UHD");

            EnsureInventory(ctx, laptop.AssetId,  wh1.WarehouseId, 50);
            EnsureInventory(ctx, phone.AssetId,   wh1.WarehouseId, 70);
            EnsureInventory(ctx, monitor.AssetId, wh1.WarehouseId, 0);

            if (wh2 != null)
            {
                EnsureInventory(ctx, laptop.AssetId, wh2.WarehouseId, 20);
                EnsureInventory(ctx, phone.AssetId,  wh2.WarehouseId, 5);
            }

            // ── Ensure asset của renter2 + inventory ─────────────────
            if (renter2 != null)
            {
                var box    = EnsureAsset(ctx, renter2.UserId, "Thùng hàng 50x50x50", "thùng",  0.5m,  "Thùng carton đóng gói hàng");
                var pallet = EnsureAsset(ctx, renter2.UserId, "Pallet gỗ",            "pallet", 20.0m, "Pallet gỗ tiêu chuẩn 1200x1000");

                EnsureInventory(ctx, box.AssetId,    wh1.WarehouseId, 200);
                EnsureInventory(ctx, pallet.AssetId, wh1.WarehouseId, 8);
            }
        }

        private static RenterAsset EnsureAsset(
            ApplicationDbContext ctx, int renterId, string name, string unit,
            decimal? weight, string? desc)
        {
            var a = ctx.RenterAssets.FirstOrDefault(x => x.RenterId == renterId && x.AssetName == name);
            if (a == null)
            {
                a = new RenterAsset
                {
                    RenterId      = renterId,
                    AssetName     = name,
                    Unit          = unit,
                    WeightPerUnit = weight,
                    Description   = desc,
                    CreatedAt     = DateTime.UtcNow,
                };
                ctx.RenterAssets.Add(a);
                ctx.SaveChanges();
            }
            return a;
        }

        private static void EnsureInventory(
            ApplicationDbContext ctx, int assetId, int warehouseId, int qty)
        {
            if (!ctx.RenterInventories.Any(x => x.AssetId == assetId && x.WarehouseId == warehouseId))
            {
                ctx.RenterInventories.Add(new RenterInventory
                {
                    AssetId     = assetId,
                    WarehouseId = warehouseId,
                    Quantity    = qty,
                    UpdatedAt   = DateTime.UtcNow,
                });
                ctx.SaveChanges();
            }
        }
    }
}

