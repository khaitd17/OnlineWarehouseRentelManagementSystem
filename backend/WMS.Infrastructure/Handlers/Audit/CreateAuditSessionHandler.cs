using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.CreateAuditSession;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Audit;

public class CreateAuditSessionHandler : IRequestHandler<CreateAuditSessionCommand, ApiResponse<int>>
{
    private readonly ApplicationDbContext _db;

    public CreateAuditSessionHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<int>> Handle(CreateAuditSessionCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);
        if (warehouse == null)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");

        var creatorExists = await _db.Users.AnyAsync(u => u.UserId == request.CreatedBy, cancellationToken);
        if (!creatorExists)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy người dùng với ID {request.CreatedBy}.");

        // Kiểm tra quyền dựa theo role
        var role = request.UserRole?.ToUpper() ?? "";

        if (role == "OWNER")
        {
            // OWNER phải sở hữu kho
            if (warehouse.OwnerId != request.CreatedBy)
                return ApiResponse<int>.ErrorResponse("Bạn không có quyền tạo phiên kiểm kê cho kho này. Chỉ chủ kho mới có thể thực hiện.");
        }
        else if (role == "RENTER")
        {
            // RENTER phải có hợp đồng thuê ACTIVE cho kho này
            var hasActiveContract = await _db.Contracts
                .AnyAsync(c => c.WarehouseId == request.WarehouseId
                    && c.RenterId == request.CreatedBy
                    && c.Status == "ACTIVE", cancellationToken);
            if (!hasActiveContract)
                return ApiResponse<int>.ErrorResponse("Bạn không có hợp đồng thuê kho này hoặc hợp đồng đã hết hạn.");

            // Giới hạn RENTER chỉ tạo 1 phiên kiểm kê / tháng / kho
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var hasCreatedThisMonth = await _db.AuditSessions
                .AnyAsync(a => a.WarehouseId == request.WarehouseId
                    && a.CreatedBy == request.CreatedBy
                    && a.CreatedAt >= startOfMonth, cancellationToken);
            if (hasCreatedThisMonth)
                return ApiResponse<int>.ErrorResponse(
                    "Bạn chỉ được tạo yêu cầu kiểm kê 1 lần/tháng cho mỗi kho. Vui lòng đợi sang tháng sau.");
        }
        else
        {
            return ApiResponse<int>.ErrorResponse("Vai trò không hợp lệ để tạo phiên kiểm kê.");
        }

        // Kiểm tra không có phiên đang mở
        var existingOpen = await _db.AuditSessions
            .AnyAsync(a => a.WarehouseId == request.WarehouseId
                && (a.Status == "OPEN" || a.Status == "PENDING_APPROVAL" || a.Status == "APPROVED" || a.Status == "IN_PROGRESS"),
                cancellationToken);
        if (existingOpen)
            return ApiResponse<int>.ErrorResponse("Kho này đã có phiên kiểm kê đang hoạt động. Vui lòng hoàn thành phiên hiện tại trước.");

        // OWNER tạo → APPROVED, RENTER tạo → PENDING_APPROVAL
        var status = role == "OWNER" ? "APPROVED" : "PENDING_APPROVAL";

        var session = new AuditSession
        {
            WarehouseId = request.WarehouseId,
            CreatedBy = request.CreatedBy,
            Status = status,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditSessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        var message = role == "OWNER"
            ? "Tạo phiên kiểm kê thành công."
            : "Tạo yêu cầu kiểm kê thành công. Chờ chủ kho duyệt.";

        return ApiResponse<int>.SuccessResponse(session.AuditId, message);
    }
}
