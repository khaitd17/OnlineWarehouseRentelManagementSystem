using Microsoft.EntityFrameworkCore;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly ApplicationDbContext _context;

    public SubscriptionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> IsSubscriptionActiveAsync(int userId)
    {
        var subscription = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active && s.StartDate <= DateTime.UtcNow)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync();

        if (subscription == null) return false;

        // Check real-time expiry
        if (subscription.EndDate.HasValue && subscription.EndDate < DateTime.UtcNow)
        {
            return false;
        }

        return true;
    }

    public async Task<(bool IsAllowed, string Message)> CheckLimitAsync(int userId, SubscriptionLimitType limitType, decimal currentCount = 0)
    {
        var subscription = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active && s.StartDate <= DateTime.UtcNow)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync();

        // 1. Kiểm tra trạng thái hoạt động
        if (subscription == null || (subscription.EndDate.HasValue && subscription.EndDate < DateTime.UtcNow))
        {
            return (false, "Gói dịch vụ của bạn đã hết hạn hoặc không tồn tại. Vui lòng gia hạn để tiếp tục.");
        }

        // 2. Lấy thông tin gói (so sánh không phân biệt hoa thường)
        var package = await _context.SubscriptionPackages
            .FirstOrDefaultAsync(p => p.Name.ToLower() == subscription.Plan.ToLower());

        if (package == null)
        {
            return (false, "Không tìm thấy thông tin gói dịch vụ hiện tại.");
        }

        switch (limitType)
        {
            case SubscriptionLimitType.WarehouseCount:
                var warehouseCount = await _context.Warehouses.CountAsync(w => w.OwnerId == userId);
                // Nếu User đang có 1 kho và giới hạn là 1, thì warehouseCount >= package.MaxWarehouses (1 >= 1) là TRUE -> Chặn.
                if (warehouseCount >= package.MaxWarehouses)
                {
                    return (false, $"Bạn đã đạt giới hạn số lượng kho tối đa ({package.MaxWarehouses} kho) của gói {package.Name}.");
                }
                break;

            case SubscriptionLimitType.StaffCount:
                // Giả sử currentCount là số lượng nhân viên hiện tại của kho đang xét
                if (currentCount >= package.MaxStaffPerWarehouse)
                {
                    return (false, $"Kho này đã đạt giới hạn số lượng nhân viên ({package.MaxStaffPerWarehouse} nhân viên) của gói {package.Name}.");
                }
                break;

            case SubscriptionLimitType.ZoneCount:
                if (currentCount >= package.MaxZonesPerWarehouse)
                {
                    return (false, $"Kho này đã đạt giới hạn số lượng khu vực ({package.MaxZonesPerWarehouse} khu vực) của gói {package.Name}.");
                }
                break;

            case SubscriptionLimitType.TotalArea:
                var totalArea = await _context.Warehouses
                    .Where(w => w.OwnerId == userId)
                    .SumAsync(w => (decimal?)w.TotalArea) ?? 0;
                
                if (totalArea + currentCount > package.MaxTotalArea)
                {
                    return (false, $"Tổng diện tích vượt quá giới hạn cho phép ({package.MaxTotalArea} m2) của gói {package.Name}.");
                }
                break;

            case SubscriptionLimitType.EquipmentManagement:
                if (!package.AllowEquipmentManagement)
                {
                    return (false, $"Tính năng quản lý thiết bị không khả dụng trong gói {package.Name}. Vui lòng nâng cấp gói Premium.");
                }
                break;
        }

        return (true, string.Empty);
    }

    public async Task<dynamic> GetUserSubscriptionStatusAsync(int userId)
    {
        var subscription = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active && s.StartDate <= DateTime.UtcNow)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync();

        if (subscription == null) return new { success = true, isActive = false, plan = "None" };

        var package = await _context.SubscriptionPackages
            .FirstOrDefaultAsync(p => p.Name.ToLower() == subscription.Plan.ToLower());

        var currentWarehouses = await _context.Warehouses.CountAsync(w => w.OwnerId == userId);
        var currentTotalArea = await _context.Warehouses
            .Where(w => w.OwnerId == userId)
            .SumAsync(w => (decimal?)w.TotalArea) ?? 0;

        return new
        {
            success = true,
            isActive = subscription.EndDate > DateTime.UtcNow,
            plan = subscription.Plan,
            endDate = subscription.EndDate,
            currentWarehouses = currentWarehouses,
            maxWarehouses = package?.MaxWarehouses ?? 0,
            currentTotalArea = currentTotalArea,
            maxTotalArea = package?.MaxTotalArea ?? 0,
            allowEquipmentManagement = package?.AllowEquipmentManagement ?? false,
            maxStaffPerWarehouse = package?.MaxStaffPerWarehouse ?? 0,
            maxZonesPerWarehouse = package?.MaxZonesPerWarehouse ?? 0
        };
    }

    public async Task<dynamic> PreviewSubscriptionAsync(int userId, string targetPlan)
    {
        var now = DateTime.UtcNow;
        var currentSub = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active && s.EndDate > now)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync();

        var targetPkg = await _context.SubscriptionPackages
            .FirstOrDefaultAsync(p => p.Name.ToLower() == targetPlan.ToLower() && p.IsActive);

        if (targetPkg == null) return new { Success = false, Message = "Gói mục tiêu không tồn tại." };

        decimal newDailyPrice = targetPkg.Price / (targetPkg.DurationMonths * 30m);
        double addedDays = targetPkg.DurationMonths * 30.0;

        if (currentSub == null)
        {
            return new
            {
                Success = true,
                CurrentPlan = "None",
                TargetPlan = targetPkg.Name,
                RemainingDays = 0,
                ConvertedDays = 0,
                NewDuration = addedDays,
                NewEndDate = now.AddDays(addedDays)
            };
        }

        var currentPkg = await _context.SubscriptionPackages
            .FirstOrDefaultAsync(p => p.Name.ToLower() == currentSub.Plan.ToLower());

        decimal currentDailyPrice = currentPkg != null ? currentPkg.Price / (currentPkg.DurationMonths * 30m) : 0;
        
        double remainingDays = (currentSub.EndDate.Value - now).TotalDays;
        if (remainingDays < 0) remainingDays = 0;

        double convertedDays = remainingDays;
        string transitionType = "Renewal";

        if (targetPkg.Name.ToLower() != currentSub.Plan.ToLower())
        {
            if (newDailyPrice > currentDailyPrice)
            {
                // Upgrade
                convertedDays = currentDailyPrice > 0 ? (double)((decimal)remainingDays * (currentDailyPrice / newDailyPrice)) : 0;
                transitionType = "Upgrade";
            }
            else
            {
                // Downgrade - Queue after current ends
                transitionType = "Downgrade";
                return new
                {
                    Success = true,
                    CurrentPlan = currentSub.Plan,
                    TargetPlan = targetPkg.Name,
                    RemainingDays = (int)Math.Round(remainingDays, MidpointRounding.AwayFromZero),
                    ConvertedDays = 0,
                    NewDuration = (int)Math.Round(addedDays, MidpointRounding.AwayFromZero),
                    NewEndDate = currentSub.EndDate.Value.AddDays(addedDays),
                    TransitionType = transitionType,
                    Message = "Gói mới sẽ bắt đầu sau khi gói cũ kết thúc."
                };
            }
        }

        return new
        {
            Success = true,
            CurrentPlan = currentSub.Plan,
            TargetPlan = targetPkg.Name,
            RemainingDays = (int)Math.Round(remainingDays, MidpointRounding.AwayFromZero),
            ConvertedDays = (int)Math.Round(convertedDays, MidpointRounding.AwayFromZero),
            NewDuration = (int)Math.Round(convertedDays + addedDays, MidpointRounding.AwayFromZero),
            NewEndDate = now.AddDays(convertedDays + addedDays),
            TransitionType = transitionType
        };
    }
}
