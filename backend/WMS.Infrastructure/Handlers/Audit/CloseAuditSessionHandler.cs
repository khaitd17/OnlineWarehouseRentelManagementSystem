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
            .FirstOrDefaultAsync(s => s.AuditId == request.AuditId, cancellationToken);

        if (session == null)
            return ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê.");

        if (session.Status == "COMPLETED")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê đã được đóng trước đó.");

        if (session.Status == "CANCELLED")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê đã bị hủy, không thể đóng.");

        session.Status = "COMPLETED";
        session.CompletedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            session.Notes = string.IsNullOrWhiteSpace(session.Notes)
                ? request.Notes
                : session.Notes + "\n" + request.Notes;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Đóng phiên kiểm kê thành công.");
    }
}
