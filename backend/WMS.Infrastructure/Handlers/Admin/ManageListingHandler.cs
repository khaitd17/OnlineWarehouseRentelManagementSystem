using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.ManageListing;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

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
        var validActions = new[] { "SHOW", "HIDE", "DELETE", "REJECT" };
        var action = request.Action?.ToUpper();
        if (string.IsNullOrWhiteSpace(action) || !validActions.Contains(action))
        {
            return ApiResponse<bool>.ErrorResponse(
                "Hành động không hợp lệ.",
                new List<string> { "Hành động phải là SHOW, HIDE, REJECT hoặc DELETE." });
        }

        var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");
        }

        if (action == "SHOW")
        {
            if (warehouse.Status != "HIDDEN" && warehouse.Status != "PENDING" && warehouse.Status != "REJECTED")
                return ApiResponse<bool>.ErrorResponse("Chỉ có thể phê duyệt kho đang chờ duyệt.");
            warehouse.Status = "APPROVED";
        }
        else if (action == "REJECT")
        {
            if (warehouse.Status != "PENDING" && warehouse.Status != "HIDDEN")
                return ApiResponse<bool>.ErrorResponse("Chỉ có thể từ chối kho đang chờ duyệt.");
            warehouse.Status = "REJECTED";
        }
        else if (action == "HIDE")
        {
            if (warehouse.Status != "APPROVED")
                return ApiResponse<bool>.ErrorResponse("Chỉ có thể ẩn kho đang hiển thị (APPROVED).");
            warehouse.Status = "HIDDEN";
        }
        else // DELETE
        {
            if (warehouse.Status == "DELETED")
                return ApiResponse<bool>.ErrorResponse("Kho này đã bị xóa trước đó.");
            warehouse.Status = "DELETED";
        }

        warehouse.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var actionText = action switch
        {
            "SHOW" => "phê duyệt",
            "REJECT" => "từ chối",
            "HIDE" => "ẩn",
            _ => "xóa"
        };
        return ApiResponse<bool>.SuccessResponse(true, $"Kho đã được {actionText} thành công.");
    }
}
