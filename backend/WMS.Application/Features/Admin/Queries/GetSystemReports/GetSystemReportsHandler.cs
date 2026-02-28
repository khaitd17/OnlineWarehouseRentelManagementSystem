using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Admin.Queries.GetSystemReports;

public class GetSystemReportsHandler : IRequestHandler<GetSystemReportsQuery, ApiResponse<SystemReportResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetSystemReportsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<SystemReportResponse>> Handle(GetSystemReportsQuery request, CancellationToken cancellationToken)
    {
        var totalUsers = await _context.Users.CountAsync(cancellationToken);
        var totalOwners = await _context.Users.CountAsync(u => u.Role.RoleName == "OWNER", cancellationToken);
        var totalRenters = await _context.Users.CountAsync(u => u.Role.RoleName == "RENTER", cancellationToken);
        var totalWarehouses = await _context.Warehouses.CountAsync(cancellationToken);
        
        var areas = await _context.Warehouses
            .Select(w => new { w.TotalArea, w.AvailableArea })
            .ToListAsync(cancellationToken);
            
        var totalAvailableArea = areas.Sum(a => a.AvailableArea);
        var totalOccupiedArea = areas.Sum(a => a.TotalArea - a.AvailableArea);

        var totalRevenue = await _context.Payments
            .Where(p => p.Status == "PAID")
            .SumAsync(p => p.Amount, cancellationToken);

        var response = new SystemReportResponse(
            totalUsers,
            totalOwners,
            totalRenters,
            totalWarehouses,
            totalAvailableArea,
            totalOccupiedArea,
            totalRevenue
        );

        return ApiResponse<SystemReportResponse>.SuccessResult(response);
    }
}
