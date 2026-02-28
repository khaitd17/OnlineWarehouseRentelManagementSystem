using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetSystemReports;

public record GetSystemReportsQuery : IRequest<ApiResponse<SystemReportResponse>>;

public record SystemReportResponse(
    int TotalUsers,
    int TotalOwners,
    int TotalRenters,
    int TotalWarehouses,
    double TotalAvailableArea,
    double TotalOccupiedArea,
    decimal TotalRevenue
);
