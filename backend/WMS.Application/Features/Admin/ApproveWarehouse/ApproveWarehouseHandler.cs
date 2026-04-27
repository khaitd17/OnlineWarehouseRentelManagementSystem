using MediatR;
using WMS.Application.Common;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Admin.ApproveWarehouse;

public class ApproveWarehouseHandler : IRequestHandler<ApproveWarehouseCommand, ApiResponse<bool>>
{
    private readonly IWarehouseRepository _warehouseRepository;

    public ApproveWarehouseHandler(IWarehouseRepository warehouseRepository)
    {
        _warehouseRepository = warehouseRepository;
    }

    public async Task<ApiResponse<bool>> Handle(ApproveWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId, cancellationToken);
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
        await _warehouseRepository.UpdateAsync(warehouse, cancellationToken);

        var actionText = request.IsApproved ? "duyệt" : "từ chối";
        return ApiResponse<bool>.SuccessResponse(true, $"Kho đã được {actionText} thành công.");
    }
}
