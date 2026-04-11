using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetSystemReports;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetSystemReportsHandler : IRequestHandler<GetSystemReportsQuery, ApiResponse<SystemReportDto>>
{
    private readonly ApplicationDbContext _db;

    public GetSystemReportsHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SystemReportDto>> Handle(GetSystemReportsQuery request, CancellationToken cancellationToken)
    {
        var toDate = request.ToDate ?? DateTime.UtcNow;
        var fromDate = request.FromDate ?? toDate.AddMonths(-12);

        // ── User Stats ──
        var totalUsers = await _db.Users.CountAsync(cancellationToken);
        var activeUsers = await _db.Users.CountAsync(u => u.Status == "ACTIVE", cancellationToken);
        var lockedUsers = await _db.Users.CountAsync(u => u.Status == "LOCKED", cancellationToken);

        // ── Warehouse Stats ──
        var totalWarehouses = await _db.Warehouses.CountAsync(w => w.Status != "DELETED", cancellationToken);
        var approvedWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "APPROVED", cancellationToken);
        var pendingWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "PENDING", cancellationToken);
        var hiddenWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "HIDDEN", cancellationToken);

        // ── Subscription & Financial Stats ──
        var subscriptions = await _db.Subscriptions
            .Where(s => (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Expired) && s.StartDate >= fromDate && s.StartDate <= toDate)
            .Join(_db.SubscriptionPackages, s => s.Plan, p => p.Name, (s, p) => new { Date = s.StartDate, Amount = p.Price, PackageName = p.Name })
            .ToListAsync(cancellationToken);

        var revenueByPackage = subscriptions
            .GroupBy(s => s.PackageName)
            .Select(g => new PackageRevenueDto(g.Key, g.Sum(x => x.Amount)))
            .ToList();

        var allRevenues = subscriptions
            .Select(s => new { s.Date, s.Amount })
            .Where(x => x.Date.HasValue)
            .ToList();

        var totalRevenue = subscriptions.Sum(x => x.Amount);

        var monthlyRevenue = allRevenues
            .GroupBy(x => new { x.Date.Value.Year, x.Date.Value.Month })
            .Select(g => new MonthlyRevenueDto($"{g.Key.Month:D2}/{g.Key.Year}", g.Sum(x => x.Amount)))
            .OrderBy(x => x.Month.Substring(3, 4))
            .ThenBy(x => x.Month.Substring(0, 2))
            .ToList();

        // New subscriptions this month
        var currentMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var totalNewSubscriptionsThisMonth = await _db.Subscriptions
            .CountAsync(s => s.StartDate >= currentMonthStart, cancellationToken);

        // Expiring subscriptions (within next 7 days, active plan)
        var nextSevenDays = DateTime.UtcNow.AddDays(7);
        var expiringSubscriptions = await _db.Subscriptions
            .CountAsync(s => s.Status == WMS.Domain.Entities.SubscriptionStatus.Active && s.EndDate <= nextSevenDays, cancellationToken);

        var report = new SystemReportDto(
            totalUsers, activeUsers, lockedUsers,
            totalWarehouses, approvedWarehouses, pendingWarehouses, hiddenWarehouses,
            totalRevenue, totalNewSubscriptionsThisMonth, expiringSubscriptions,
            revenueByPackage, monthlyRevenue);

        return ApiResponse<SystemReportDto>.SuccessResponse(report, "Lấy báo cáo hệ thống thành công.");
    }
}
