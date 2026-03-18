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
        var periodLength = (toDate - fromDate).TotalDays;

        // ── User Stats ──
        var totalUsers = await _db.Users.CountAsync(cancellationToken);
        var activeUsers = await _db.Users.CountAsync(u => u.Status == "ACTIVE", cancellationToken);
        var lockedUsers = await _db.Users.CountAsync(u => u.Status == "LOCKED", cancellationToken);

        // ── Warehouse Stats ──
        var totalWarehouses = await _db.Warehouses.CountAsync(cancellationToken);
        var approvedWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "APPROVED", cancellationToken);
        var pendingWarehouses = await _db.Warehouses.CountAsync(w => w.Status == "PENDING", cancellationToken);

        // ── Contract Stats ──
        var totalContracts = await _db.Contracts.CountAsync(cancellationToken);
        var activeContracts = await _db.Contracts.CountAsync(c => c.Status == "ACTIVE", cancellationToken);

        // Expiring contracts (within next 30 days)
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thirtyDaysLater = today.AddDays(30);
        var expiringContracts = await _db.Contracts
            .CountAsync(c => c.Status == "ACTIVE" && c.EndDate >= today && c.EndDate <= thirtyDaysLater, cancellationToken);

        // ── Financial Stats ──
        var totalRevenue = await _db.Payments
            .Where(p => p.Status == "PAID")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var pendingPayments = await _db.Payments
            .Where(p => p.Status == "PENDING")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var overduePayments = await _db.Payments
            .Where(p => p.Status == "OVERDUE")
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);

        // Collection rate
        var totalPayable = totalRevenue + pendingPayments + overduePayments;
        var collectionRate = totalPayable > 0
            ? Math.Round(totalRevenue / totalPayable * 100, 2)
            : 0m;

        // Revenue growth: current period vs previous period
        var previousFrom = fromDate.AddDays(-periodLength);
        var previousTo = fromDate.AddDays(-1);
        var currentPeriodRevenue = await _db.Payments
            .Where(p => p.Status == "PAID" && p.PaymentDate >= fromDate && p.PaymentDate <= toDate)
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var previousPeriodRevenue = await _db.Payments
            .Where(p => p.Status == "PAID" && p.PaymentDate >= previousFrom && p.PaymentDate <= previousTo)
            .SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var revenueGrowthRate = previousPeriodRevenue > 0
            ? Math.Round((double)((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100), 2)
            : (currentPeriodRevenue > 0 ? 100.0 : 0.0);

        // ── Period Stats ──
        var newUsers = await _db.Users
            .CountAsync(u => u.CreatedAt >= fromDate && u.CreatedAt <= toDate, cancellationToken);
        var newWarehouses = await _db.Warehouses
            .CountAsync(w => w.CreatedAt >= fromDate && w.CreatedAt <= toDate, cancellationToken);

        // ── Monthly Revenue ──
        var rawMonthly = await _db.Payments
            .Where(p => p.Status == "PAID" && p.PaymentDate >= fromDate && p.PaymentDate <= toDate)
            .GroupBy(p => new { p.PaymentDate!.Value.Year, p.PaymentDate!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(p => p.Amount) })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync(cancellationToken);

        var monthlyRevenue = rawMonthly
            .Select(m => new MonthlyRevenueDto($"{m.Year}-{m.Month:D2}", m.Total))
            .ToList();

        // ── Top Warehouses by Revenue ──
        var topWarehouseRaw = await _db.Payments
            .Where(p => p.Status == "PAID")
            .Select(p => new { p.Amount, p.ContractId, p.Contract.WarehouseId, p.Contract.Warehouse.Name })
            .ToListAsync(cancellationToken);

        var topWarehouses = topWarehouseRaw
            .GroupBy(p => new { p.WarehouseId, p.Name })
            .Select(g => new TopWarehouseRevenueDto(
                g.Key.WarehouseId,
                g.Key.Name,
                g.Sum(p => p.Amount),
                g.Select(p => p.ContractId).Distinct().Count()
            ))
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        // ── Smart Alerts ──
        var alerts = GenerateAlerts(
            overduePayments, pendingPayments, expiringContracts,
            pendingWarehouses, collectionRate);

        // ── Recommendations ──
        var recommendations = GenerateRecommendations(
            overduePayments, pendingPayments,
            revenueGrowthRate, expiringContracts, collectionRate,
            activeContracts);

        var report = new SystemReportDto(
            totalUsers, activeUsers, lockedUsers,
            totalWarehouses, approvedWarehouses, pendingWarehouses,
            totalContracts, activeContracts, expiringContracts,
            totalRevenue, pendingPayments, overduePayments,
            collectionRate, revenueGrowthRate,
            newUsers, newWarehouses,
            monthlyRevenue, topWarehouses, alerts, recommendations);

        return ApiResponse<SystemReportDto>.SuccessResponse(report, "Lấy báo cáo hệ thống thành công.");
    }

    private static List<AlertDto> GenerateAlerts(
        decimal overduePayments, decimal pendingPayments, int expiringContracts,
        int pendingWarehouses, decimal collectionRate)
    {
        var alerts = new List<AlertDto>();

        // CRITICAL alerts
        if (overduePayments > 0)
        {
            alerts.Add(new AlertDto("CRITICAL", "Thanh toán quá hạn",
                $"Có {overduePayments:N0} VNĐ thanh toán đã quá hạn cần xử lý ngay.",
                "alert-triangle"));
        }

        // WARNING alerts
        if (expiringContracts > 0)
        {
            alerts.Add(new AlertDto("WARNING", "Hợp đồng sắp hết hạn",
                $"Có {expiringContracts} hợp đồng sẽ hết hạn trong 30 ngày tới.",
                "clock"));
        }

        if (collectionRate < 70 && collectionRate > 0)
        {
            alerts.Add(new AlertDto("WARNING", "Tỷ lệ thu tiền thấp",
                $"Tỷ lệ thu tiền chỉ đạt {collectionRate}%, cần cải thiện công tác thu hồi.",
                "trending-down"));
        }

        // INFO alerts
        if (pendingWarehouses > 0)
        {
            alerts.Add(new AlertDto("INFO", "Kho chờ duyệt",
                $"Có {pendingWarehouses} kho đang chờ được duyệt.",
                "inbox"));
        }

        if (pendingPayments > 0)
        {
            alerts.Add(new AlertDto("INFO", "Thanh toán chờ xử lý",
                $"Có {pendingPayments:N0} VNĐ thanh toán đang chờ xác nhận.",
                "credit-card"));
        }

        return alerts;
    }

    private static List<RecommendationDto> GenerateRecommendations(
        decimal overduePayments, decimal pendingPayments,
        double revenueGrowthRate, int expiringContracts, decimal collectionRate,
        int activeContracts = 0)
    {
        var recommendations = new List<RecommendationDto>();

        // Payment-related
        if (overduePayments > 0)
        {
            recommendations.Add(new RecommendationDto("PAYMENT", "Gửi nhắc nhở thanh toán",
                "Có khoản thanh toán quá hạn. Nên gửi thông báo nhắc nhở đến khách thuê để thu hồi công nợ.",
                "HIGH"));
        }

        // Contract-related
        if (expiringContracts > 0)
        {
            recommendations.Add(new RecommendationDto("CONTRACT", "Gia hạn hợp đồng",
                $"Có {expiringContracts} hợp đồng sắp hết hạn. Liên hệ khách thuê để thương lượng gia hạn, tránh mất doanh thu.",
                "HIGH"));
        }

        // Revenue-related
        if (revenueGrowthRate > 15)
        {
            recommendations.Add(new RecommendationDto("REVENUE", "Xem xét mở rộng quy mô",
                $"Doanh thu tăng trưởng {revenueGrowthRate}% so với kỳ trước. Đây là thời điểm tốt để mở rộng thêm kho hoặc dịch vụ.",
                "MEDIUM"));
        }
        else if (revenueGrowthRate < -10)
        {
            recommendations.Add(new RecommendationDto("REVENUE", "Phân tích nguyên nhân sụt giảm",
                $"Doanh thu giảm {Math.Abs(revenueGrowthRate)}% so với kỳ trước. Cần phân tích nguyên nhân và đưa ra giải pháp.",
                "HIGH"));
        }

        // Collection rate
        if (collectionRate > 0 && collectionRate < 80)
        {
            recommendations.Add(new RecommendationDto("PAYMENT", "Cải thiện quy trình thu tiền",
                $"Tỷ lệ thu tiền đạt {collectionRate}%. Cân nhắc áp dụng phạt trễ hạn hoặc ưu đãi thanh toán sớm.",
                "MEDIUM"));
        }

        return recommendations;
    }
}
