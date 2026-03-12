using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetSystemReports;
using WMS.Infrastructure.Persistence.ScaffoldModels;

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
        var fromDate = request.FromDate ?? DateTime.UtcNow.AddMonths(-12);
        var toDate = request.ToDate ?? DateTime.UtcNow;

        var totalUsers = await _db.Users.CountAsync(cancellationToken);
        var activeUsers = await _db.Users.CountAsync(u => u.Status == "ACTIVE", cancellationToken);
        var lockedUsers = await _db.Users.CountAsync(u => u.Status == "LOCKED", cancellationToken);

        var totalWarehouses = await _db.Warehouses.CountAsync(cancellationToken);
        var approvedWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "APPROVED", cancellationToken);
        var pendingWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "PENDING", cancellationToken);

        var totalContracts = await _db.Contracts.CountAsync(cancellationToken);
        var activeContracts = await _db.Contracts.CountAsync(c => c.Status == "ACTIVE", cancellationToken);

        var totalRevenue = await _db.Payments
            .Where(p => p.Status == "PAID")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var pendingPayments = await _db.Payments
            .Where(p => p.Status == "PENDING")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var overduePayments = await _db.Payments
            .Where(p => p.Status == "OVERDUE")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);

        var warehousesWithArea = await _db.Warehouses
            .Where(w => w.Status == "APPROVED" && w.TotalArea > 0)
            .Select(w => new { w.TotalArea, w.AvailableArea })
            .ToListAsync(cancellationToken);

        double avgOccupancy = 0;
        if (warehousesWithArea.Count > 0)
        {
            avgOccupancy = Math.Round(warehousesWithArea
                .Average(w => (w.TotalArea - w.AvailableArea) / w.TotalArea * 100), 2);
        }

        var newUsers = await _db.Users
            .CountAsync(u => u.CreatedAt >= fromDate && u.CreatedAt <= toDate, cancellationToken);
        var newWarehouses = await _db.Warehouses
            .CountAsync(w => w.CreatedAt >= fromDate && w.CreatedAt <= toDate, cancellationToken);

        var rawMonthly = await _db.Payments
            .Where(p => p.Status == "PAID" && p.PaymentDate >= fromDate && p.PaymentDate <= toDate)
            .GroupBy(p => new { p.PaymentDate!.Value.Year, p.PaymentDate!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(p => p.Amount) })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync(cancellationToken);

        var monthlyRevenue = rawMonthly
            .Select(m => new MonthlyRevenueDto($"{m.Year}-{m.Month:D2}", m.Total))
            .ToList();

        var report = new SystemReportDto(
            totalUsers, activeUsers, lockedUsers,
            totalWarehouses, approvedWarehouses, pendingWarehouses,
            totalContracts, activeContracts,
            totalRevenue, pendingPayments, overduePayments,
            avgOccupancy, newUsers, newWarehouses, monthlyRevenue);

        return ApiResponse<SystemReportDto>.SuccessResponse(report, "Lấy báo cáo hệ thống thành công.");
    }
}
