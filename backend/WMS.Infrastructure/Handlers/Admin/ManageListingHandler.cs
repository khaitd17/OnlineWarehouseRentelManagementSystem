using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.ManageListing;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Handlers.Admin;

public class ManageListingHandler : IRequestHandler<ManageListingCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public ManageListingHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(ManageListingCommand request, CancellationToken cancellationToken)
    {
        var validActions = new[] { "SHOW", "HIDE" };
        var action = request.Action?.ToUpper();
        if (string.IsNullOrWhiteSpace(action) || !validActions.Contains(action))
        {
            return ApiResponse<bool>.ErrorResponse(
                "Hành động không hợp lệ.",
                new List<string> { "Hành động phải là SHOW hoặc HIDE." });
        }

        var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");
        }

        if (action == "SHOW")
        {
            if (warehouse.Status != "HIDDEN")
                return ApiResponse<bool>.ErrorResponse("Chỉ có thể hiển thị kho đang bị ẩn.");
            warehouse.Status = "APPROVED";
        }
        else
        {
            if (warehouse.Status != "APPROVED")
                return ApiResponse<bool>.ErrorResponse("Chỉ có thể ẩn kho đang hiển thị (APPROVED).");
            warehouse.Status = "HIDDEN";
        }

        warehouse.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var actionText = action == "SHOW" ? "hiển thị" : "ẩn";
        return ApiResponse<bool>.SuccessResponse(true, $"Kho đã được {actionText} thành công.");
    }
}
