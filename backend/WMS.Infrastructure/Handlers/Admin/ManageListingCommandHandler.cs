using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Infrastructure.Persistence;
using WMS.Application.Features.Admin.ManageListing;

namespace WMS.Infrastructure.Handlers.Admin;

public class ManageListingCommandHandler : IRequestHandler<ManageListingCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public ManageListingCommandHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(ManageListingCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _db.Warehouses
            .FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);

        if (warehouse == null)
            return ApiResponse<bool>.ErrorResponse("Không tìm thấy kho.");

        switch (request.Action.ToUpper())
        {
            case "HIDE":
                if (warehouse.Status != "APPROVED")
                    return ApiResponse<bool>.ErrorResponse("Chỉ có thể ẩn kho đã được duyệt.");
                warehouse.Status = "HIDDEN";
                break;

            case "SHOW":
                if (warehouse.Status != "HIDDEN")
                    return ApiResponse<bool>.ErrorResponse("Chỉ có thể hiện kho đang bị ẩn.");
                warehouse.Status = "APPROVED";
                break;

            case "DELETE":
                if (warehouse.Status == "DELETED")
                    return ApiResponse<bool>.ErrorResponse("Kho này đã bị xóa.");
                warehouse.Status = "DELETED";
                break;

            default:
                return ApiResponse<bool>.ErrorResponse("Hành động không hợp lệ.");
        }

        await _db.SaveChangesAsync(cancellationToken);

        string actionName = request.Action.ToUpper() switch
        {
            "HIDE" => "Ẩn",
            "SHOW" => "Hiện",
            "DELETE" => "Xóa",
            _ => ""
        };

        return ApiResponse<bool>.SuccessResponse(true, $"{actionName} kho thành công.");
    }
}
