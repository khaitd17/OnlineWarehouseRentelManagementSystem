using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetSystemReports;

public class GetSystemReportsQuery : IRequest<ApiResponse<SystemReportDto>>
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public record SystemReportDto(
    // User stats
    int TotalUsers,
    int ActiveUsers,
    int LockedUsers,
    // Warehouse stats
    int TotalWarehouses,
    int ApprovedWarehouses,
    int PendingWarehouses,
    // Contract stats
    int TotalContracts,
    int ActiveContracts,
    int ExpiringContracts,
    // Financial stats
    decimal TotalRevenue,
    decimal PendingPayments,
    decimal OverduePayments,
    decimal CollectionRate,
    double RevenueGrowthRate,
    // Occupancy
    double AverageOccupancyRate,
    // Period stats
    int NewUsersThisPeriod,
    int NewWarehousesThisPeriod,
    // Detailed data
    List<MonthlyRevenueDto> MonthlyRevenue,
    List<TopWarehouseRevenueDto> TopWarehousesByRevenue,
    // Smart alerts & recommendations
    List<AlertDto> Alerts,
    List<RecommendationDto> Recommendations
);

public record MonthlyRevenueDto(
    string Period,
    decimal Amount
);

public record TopWarehouseRevenueDto(
    int WarehouseId,
    string Name,
    decimal Revenue,
    int ContractCount
);

public record AlertDto(
    string Level,   // CRITICAL, WARNING, INFO
    string Title,
    string Message,
    string Icon
);

public record RecommendationDto(
    string Type,        // REVENUE, OCCUPANCY, CONTRACT, PAYMENT
    string Title,
    string Description,
    string Priority     // HIGH, MEDIUM, LOW
);
