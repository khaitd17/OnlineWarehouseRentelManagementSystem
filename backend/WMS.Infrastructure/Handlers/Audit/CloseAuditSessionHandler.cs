using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.CloseAuditSession;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Handlers.Audit;

public class CloseAuditSessionHandler : IRequestHandler<CloseAuditSessionCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public CloseAuditSessionHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(CloseAuditSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _db.AuditSessions
            .Include(s => s.Warehouse)
            .Include(s => s.AuditResults)
            .FirstOrDefaultAsync(s => s.AuditId == request.AuditId, cancellationToken);

        if (session == null)
            return ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê.");

        // Kiểm tra quyền sở hữu kho
        if (session.Warehouse.OwnerId != request.UserId)
            return ApiResponse<bool>.ErrorResponse("Bạn không có quyền đóng phiên kiểm kê này. Chỉ chủ kho mới có thể thực hiện.");

        if (session.Status == "COMPLETED")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê đã được đóng trước đó.");

        if (session.Status == "CANCELLED")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê đã bị hủy, không thể đóng.");

        // Nếu chưa có kết quả kiểm kê nào được ghi nhận → CANCELLED
        // Nếu đã có kết quả → COMPLETED
        bool hasResults = session.AuditResults != null && session.AuditResults.Count > 0;

        if (hasResults)
        {
            session.Status = "COMPLETED";
        }
        else
        {
            session.Status = "CANCELLED";
        }

        session.CompletedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            session.Notes = string.IsNullOrWhiteSpace(session.Notes)
                ? $"Chủ kho: {request.Notes}"
                : session.Notes + "\n" + $"Chủ kho: {request.Notes}";
        }

        await _db.SaveChangesAsync(cancellationToken);

        var message = hasResults
            ? "Đã đóng phiên kiểm kê thành công (Hoàn thành)."
            : "Đã hủy phiên kiểm kê (chưa có kết quả ghi nhận).";

        return ApiResponse<bool>.SuccessResponse(true, message);
    }
}
