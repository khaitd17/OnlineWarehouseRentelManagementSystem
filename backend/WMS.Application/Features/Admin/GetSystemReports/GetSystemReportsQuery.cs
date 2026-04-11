using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetSystemReports;

public class GetSystemReportsQuery : IRequest<ApiResponse<SystemReportDto>>
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public record PackageRevenueDto(string PackageName, decimal Revenue);
public record MonthlyRevenueDto(string Month, decimal Revenue);

public record SystemReportDto(
    // User stats
    int TotalUsers,
    int ActiveUsers,
    int LockedUsers,
    // Warehouse stats
    int TotalWarehouses,
    int ApprovedWarehouses,
    int PendingWarehouses,
    int HiddenWarehouses,
    // Subscription & Financial stats
    decimal TotalRevenue,
    int TotalNewSubscriptionsThisMonth,
    int ExpiringSubscriptions,
    // Chart data
    List<PackageRevenueDto> RevenueByPackage,
    List<MonthlyRevenueDto> MonthlyRevenue
);
