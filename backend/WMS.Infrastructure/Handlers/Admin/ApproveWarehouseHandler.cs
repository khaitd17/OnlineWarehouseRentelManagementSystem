using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.ApproveWarehouse;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Handlers.Admin;

public class ApproveWarehouseHandler : IRequestHandler<ApproveWarehouseCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public ApproveWarehouseHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(ApproveWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");
        }

        if (warehouse.Status != "PENDING")
        {
            return ApiResponse<bool>.ErrorResponse("Chỉ có thể duyệt/từ chối kho ở trạng thái PENDING.");
        }

        if (request.IsApproved)
        {
            warehouse.Status = "APPROVED";
            warehouse.ApprovedAt = DateTime.UtcNow;
            warehouse.ApprovedBy = request.ApprovedBy;
            warehouse.RejectionReason = null;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
            {
                return ApiResponse<bool>.ErrorResponse(
                    "Vui lòng cung cấp lý do từ chối.",
                    new List<string> { "RejectionReason là bắt buộc khi từ chối kho." });
            }
            warehouse.Status = "REJECTED";
            warehouse.RejectionReason = request.RejectionReason;
            warehouse.ApprovedBy = request.ApprovedBy;
        }

        warehouse.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var actionText = request.IsApproved ? "duyệt" : "từ chối";
        return ApiResponse<bool>.SuccessResponse(true, $"Kho đã được {actionText} thành công.");
    }
}
