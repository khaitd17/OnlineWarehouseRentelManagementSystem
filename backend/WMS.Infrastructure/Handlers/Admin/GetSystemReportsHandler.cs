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
        // Total Revenue: For mock purposes, using sum of payments or subscriptions. Since we removed pending stuff, we just sum paid payments.
        var totalRevenue = await _db.Payments
            .Where(p => p.Status == "PAID")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        
        var rentalPaymentRevenue = await _db.RentalPayments
            .Where(p => p.Status == "PAID")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);

        totalRevenue += rentalPaymentRevenue;

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
            totalRevenue, totalNewSubscriptionsThisMonth, expiringSubscriptions);

        return ApiResponse<SystemReportDto>.SuccessResponse(report, "Lấy báo cáo hệ thống thành công.");
    }
}
