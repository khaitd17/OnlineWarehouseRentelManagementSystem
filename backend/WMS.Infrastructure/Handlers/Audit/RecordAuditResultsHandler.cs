using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.RecordAuditResults;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

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
        var session = await _db.AuditSessions
            .Include(a => a.Warehouse)
            .FirstOrDefaultAsync(a => a.AuditId == request.AuditId, cancellationToken);
        if (session == null)
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy phiên kiểm kê với ID {request.AuditId}.");

        // Kiểm tra quyền: STAFF được gán hoặc OWNER kho
        bool isOwner = session.Warehouse.OwnerId == request.UserId;
        bool isAssignedStaff = session.AssignedTo == request.UserId;

        if (!isOwner && !isAssignedStaff)
            return ApiResponse<bool>.ErrorResponse("Bạn không có quyền ghi nhận kết quả cho phiên kiểm kê này.");

        if (session.Status == "CANCELLED")
            return ApiResponse<bool>.ErrorResponse("Thất bại! Chủ kho đã đóng phiên kiểm kê này. Kết quả của bạn không thể ghi nhận.");

        if (session.Status == "COMPLETED")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê đã hoàn thành, không thể ghi nhận thêm kết quả.");

        if (session.Status == "REJECTED")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê đã bị từ chối, không thể ghi nhận kết quả.");

        if (session.Status != "APPROVED" && session.Status != "IN_PROGRESS" && session.Status != "OPEN")
            return ApiResponse<bool>.ErrorResponse("Phiên kiểm kê chưa được duyệt hoặc đã hoàn thành, không thể ghi nhận kết quả.");

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

        // Lấy tất cả kết quả đã có cho phiên này
        var existingResults = await _db.AuditResults
            .Where(r => r.AuditId == request.AuditId)
            .ToListAsync(cancellationToken);

        foreach (var item in request.Items)
        {
            var trimmedName = item.ItemName.Trim();
            var existing = existingResults.FirstOrDefault(r => 
                r.ItemName.Trim().Equals(trimmedName, StringComparison.OrdinalIgnoreCase));

            if (existing != null)
            {
                // Cập nhật kết quả đã tồn tại
                existing.ExpectedQty = item.ExpectedQty;
                existing.ActualQty = item.ActualQty;
                existing.DiscrepancyReason = item.DiscrepancyReason;
                existing.RecordedBy = request.UserId;
                existing.CreatedAt = DateTime.UtcNow;
            }
            else
            {
                // Thêm mới
                _db.AuditResults.Add(new AuditResult
                {
                    AuditId = request.AuditId,
                    ItemName = trimmedName,
                    ExpectedQty = item.ExpectedQty,
                    ActualQty = item.ActualQty,
                    DiscrepancyReason = item.DiscrepancyReason,
                    RecordedBy = request.UserId,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Chuyển trạng thái sang IN_PROGRESS nếu đang ở APPROVED
        if (session.Status == "APPROVED" || session.Status == "OPEN")
        {
            session.Status = "IN_PROGRESS";
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
