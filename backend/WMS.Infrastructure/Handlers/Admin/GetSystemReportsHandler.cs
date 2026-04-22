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
        var toDateRaw = request.ToDate ?? DateTime.UtcNow;
        var toDate = toDateRaw.Date.AddDays(1).AddTicks(-1);
        var fromDate = request.FromDate ?? toDate.Date.AddMonths(-12);

        // ── User Stats (filtered by registration date) ──
        var totalUsers = await _db.Users.CountAsync(u => u.CreatedAt >= fromDate && u.CreatedAt <= toDate, cancellationToken);
        var activeUsers = await _db.Users.CountAsync(u => u.Status == "ACTIVE" && u.CreatedAt >= fromDate && u.CreatedAt <= toDate, cancellationToken);
        var lockedUsers = await _db.Users.CountAsync(u => u.Status == "LOCKED" && u.CreatedAt >= fromDate && u.CreatedAt <= toDate, cancellationToken);

        // ── Warehouse Stats (filtered by creation date) ──
        var totalWarehouses = await _db.Warehouses.CountAsync(w => w.Status != "DELETED" && w.CreatedAt >= fromDate && w.CreatedAt <= toDate, cancellationToken);
        var approvedWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "APPROVED" && w.CreatedAt >= fromDate && w.CreatedAt <= toDate, cancellationToken);
        var pendingWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "PENDING" && w.CreatedAt >= fromDate && w.CreatedAt <= toDate, cancellationToken);
        var hiddenWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "HIDDEN" && w.CreatedAt >= fromDate && w.CreatedAt <= toDate, cancellationToken);

        List<PackageRevenueDto> revenueByPackage = new();
        List<MonthlyRevenueDto> monthlyRevenue = new();
        decimal totalRevenue = 0;
        int totalNewSubscriptionsThisMonth = 0;
        int expiringSubscriptions = 0;

        try
        {
            var subscriptions = await (
                from s in _db.Subscriptions
                where (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Expired)
                      && s.StartDate >= fromDate && s.StartDate <= toDate
                join p in _db.SubscriptionPackages on s.Plan equals p.Name into ps
                from p in ps.DefaultIfEmpty()
                select new
                {
                    Date = s.StartDate,
                    Amount = p != null ? p.Price : 0m,
                    PackageName = p != null ? p.Name : s.Plan
                }
            ).ToListAsync(cancellationToken);

            revenueByPackage = subscriptions
                .GroupBy(s => s.PackageName)
                .Select(g => new PackageRevenueDto(g.Key ?? "Không xác định", g.Sum(x => x.Amount)))
                .ToList();

            totalRevenue = subscriptions.Sum(x => x.Amount);

            monthlyRevenue = subscriptions
                .Where(x => x.Date.HasValue)
                .GroupBy(x => new { x.Date!.Value.Year, x.Date.Value.Month })
                .Select(g => new MonthlyRevenueDto($"{g.Key.Month:D2}/{g.Key.Year}", g.Sum(x => x.Amount)))
                .OrderBy(x => x.Month.Substring(3, 4))
                .ThenBy(x => x.Month.Substring(0, 2))
                .ToList();
        }
        catch
        {
            // If subscription_packages table is missing or join fails, continue with empty revenue data
        }

        try
        {
            // Count new subscriptions within the selected date range
            totalNewSubscriptionsThisMonth = await _db.Subscriptions
                .CountAsync(s => s.StartDate >= fromDate && s.StartDate <= toDate, cancellationToken);

            var nextSevenDays = DateTime.UtcNow.AddDays(7);
            expiringSubscriptions = await _db.Subscriptions
                .CountAsync(s => s.Status == SubscriptionStatus.Active && s.EndDate <= nextSevenDays, cancellationToken);
        }
        catch { }

        var report = new SystemReportDto(
            totalUsers, activeUsers, lockedUsers,
            totalWarehouses, approvedWarehouses, pendingWarehouses, hiddenWarehouses,
            totalRevenue, totalNewSubscriptionsThisMonth, expiringSubscriptions,
            revenueByPackage, monthlyRevenue);

        return ApiResponse<SystemReportDto>.SuccessResponse(report, "Lấy báo cáo hệ thống thành công.");
    }
}
