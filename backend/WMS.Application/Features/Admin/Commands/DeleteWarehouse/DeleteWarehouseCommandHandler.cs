using MediatR;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.DeleteWarehouse;

public class DeleteWarehouseCommandHandler : IRequestHandler<DeleteWarehouseCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteWarehouseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FindAsync(new object[] { request.WarehouseId }, cancellationToken);
        if (warehouse == null)
        {
            return ApiResponse<bool>.FailureResult("Warehouse not found");
        }

        _context.Warehouses.Remove(warehouse);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(true, "Warehouse deleted successfully");
    }
}
