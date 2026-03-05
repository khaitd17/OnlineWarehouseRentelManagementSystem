using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetSystemReports;

public class GetSystemReportsQuery : IRequest<ApiResponse<SystemReportDto>>
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public record SystemReportDto(
    int TotalUsers,
    int ActiveUsers,
    int LockedUsers,
    int TotalWarehouses,
    int ApprovedWarehouses,
    int PendingWarehouses,
    int TotalContracts,
    int ActiveContracts,
    decimal TotalRevenue,
    decimal PendingPayments,
    decimal OverduePayments,
    double AverageOccupancyRate,
    int NewUsersThisPeriod,
    int NewWarehousesThisPeriod,
    List<MonthlyRevenueDto> MonthlyRevenue
);

public record MonthlyRevenueDto(
    string Period,
    decimal Amount
);
