using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.RecordAuditResults;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Handlers.Audit;

public class RecordAuditResultsHandler : IRequestHandler<RecordAuditResultsCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public RecordAuditResultsHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(RecordAuditResultsCommand request, CancellationToken cancellationToken)
    {
        var session = await _db.AuditSessions.FirstOrDefaultAsync(a => a.AuditId == request.AuditId, cancellationToken);
        if (session == null)
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy phiên kiểm kê với ID {request.AuditId}.");

        if (session.Status != "OPEN")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê đã hoàn thành, không thể ghi nhận thêm kết quả.");

        if (request.Items == null || request.Items.Count == 0)
            return ApiResponse<bool>.ErrorResponse("Danh sách kết quả kiểm kê không được để trống.",
                new List<string> { "Vui lòng cung cấp ít nhất một mục kiểm kê." });

        var errors = new List<string>();
        for (int i = 0; i < request.Items.Count; i++)
        {
            var item = request.Items[i];
            if (string.IsNullOrWhiteSpace(item.ItemName))
                errors.Add($"Mục {i + 1}: Tên hàng hóa không được để trống.");
            if (item.ExpectedQty < 0)
                errors.Add($"Mục {i + 1}: Số lượng dự kiến phải >= 0.");
            if (item.ActualQty < 0)
                errors.Add($"Mục {i + 1}: Số lượng thực tế phải >= 0.");
        }
        if (errors.Count > 0)
            return ApiResponse<bool>.ErrorResponse("Dữ liệu kiểm kê không hợp lệ.", errors);

        foreach (var item in request.Items)
        {
            _db.AuditResults.Add(new AuditResult
            {
                AuditId = request.AuditId,
                ItemName = item.ItemName.Trim(),
                ExpectedQty = item.ExpectedQty,
                ActualQty = item.ActualQty,
                DiscrepancyReason = item.DiscrepancyReason,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (request.CompleteSession)
        {
            session.Status = "COMPLETED";
            session.CompletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);

        var message = request.CompleteSession
            ? $"Đã ghi nhận {request.Items.Count} kết quả kiểm kê và hoàn thành phiên."
            : $"Đã ghi nhận {request.Items.Count} kết quả kiểm kê thành công.";

        return ApiResponse<bool>.SuccessResponse(true, message);
    }
}
