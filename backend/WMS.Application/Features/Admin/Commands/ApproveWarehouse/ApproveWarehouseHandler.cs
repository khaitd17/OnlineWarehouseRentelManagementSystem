using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Admin.Commands.ApproveWarehouse;

public class ApproveWarehouseHandler : IRequestHandler<ApproveWarehouseCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;

    public ApproveWarehouseHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(ApproveWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FindAsync(new object[] { request.WarehouseId }, cancellationToken);
        if (warehouse == null)
        {
            return ApiResponse<bool>.FailureResult("Warehouse not found");
        }

        if (request.IsApproved)
        {
            warehouse.Status = "APPROVED";
            warehouse.ApprovedAt = DateTime.Now;
            // TODO: Set ApprovedBy from current user context
        }
        else
        {
            warehouse.Status = "REJECTED";
            warehouse.RejectionReason = request.RejectionReason;
        }

        warehouse.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(true, $"Warehouse {warehouse.Status.ToLower()} successfully");
    }
}
