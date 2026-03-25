using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.ApproveAuditSession;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Handlers.Audit;

public class ApproveAuditSessionHandler : IRequestHandler<ApproveAuditSessionCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public ApproveAuditSessionHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(ApproveAuditSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _db.AuditSessions
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.AuditId == request.AuditId, cancellationToken);

        if (session == null)
            return ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê.");

        // Kiểm tra quyền sở hữu kho
        if (session.Warehouse.OwnerId != request.UserId)
            return ApiResponse<bool>.ErrorResponse("Bạn không có quyền duyệt phiên kiểm kê này. Chỉ chủ kho mới có thể thực hiện.");

        if (session.Status != "PENDING_APPROVAL" && session.Status != "APPROVED")
            return ApiResponse<bool>.ErrorResponse($"Không thể duyệt phiên kiểm kê ở trạng thái '{session.Status}'.");

        // Kiểm tra nhân viên được gán
        var staffMembership = await _db.WarehouseMemberships
            .Include(m => m.User)
            .Include(m => m.Role)
            .FirstOrDefaultAsync(m => m.UserId == request.AssignedTo
                && m.WarehouseId == session.WarehouseId
                && m.IsActive
                && m.Role.Code == "STAFF", cancellationToken);

        if (staffMembership == null)
            return ApiResponse<bool>.ErrorResponse("Nhân viên được chọn không thuộc kho này hoặc đã bị vô hiệu hóa.");

        session.Status = "APPROVED";
        session.AssignedTo = request.AssignedTo;

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            session.Notes = string.IsNullOrWhiteSpace(session.Notes)
                ? request.Notes
                : session.Notes + "\n" + request.Notes;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, $"Đã duyệt phiên kiểm kê và giao cho {staffMembership.User.FullName}.");
    }
}

public class RejectAuditSessionHandler : IRequestHandler<RejectAuditSessionCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public RejectAuditSessionHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(RejectAuditSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _db.AuditSessions
            .Include(s => s.Warehouse)
            .FirstOrDefaultAsync(s => s.AuditId == request.AuditId, cancellationToken);

        if (session == null)
            return ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê.");

        if (session.Warehouse.OwnerId != request.UserId)
            return ApiResponse<bool>.ErrorResponse("Bạn không có quyền từ chối phiên kiểm kê này.");

        if (session.Status != "PENDING_APPROVAL")
            return ApiResponse<bool>.ErrorResponse($"Không thể từ chối phiên kiểm kê ở trạng thái '{session.Status}'.");

        session.Status = "REJECTED";

        if (!string.IsNullOrWhiteSpace(request.Reason))
        {
            session.Notes = string.IsNullOrWhiteSpace(session.Notes)
                ? $"Lý do từ chối: {request.Reason}"
                : session.Notes + $"\nLý do từ chối: {request.Reason}";
        }

        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Đã từ chối yêu cầu kiểm kê.");
    }
}
