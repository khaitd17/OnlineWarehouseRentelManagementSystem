using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.ExportAuditReport;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Audit;

public class ExportAuditReportHandler : IRequestHandler<ExportAuditReportQuery, ApiResponse<ExportAuditReportResult>>
{
    private readonly ApplicationDbContext _db;

    public ExportAuditReportHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<ExportAuditReportResult>> Handle(ExportAuditReportQuery request, CancellationToken cancellationToken)
    {
        var session = await _db.AuditSessions
            .Include(a => a.Warehouse)
            .Include(a => a.CreatedByNavigation)
            .Include(a => a.AuditResults)
            .FirstOrDefaultAsync(a => a.AuditId == request.AuditId, cancellationToken);

        if (session == null)
            return ApiResponse<ExportAuditReportResult>.ErrorResponse($"Không tìm thấy phiên kiểm kê với ID {request.AuditId}.");

        var sb = new StringBuilder();

        sb.AppendLine("BÁO CÁO KIỂM KÊ KHO");
        sb.AppendLine($"Mã phiên kiểm kê: {session.AuditId}");
        sb.AppendLine($"Kho: {session.Warehouse.Name}");
        sb.AppendLine($"Địa chỉ: {session.Warehouse.Address}");
        sb.AppendLine($"Người tạo: {session.CreatedByNavigation.FullName}");
        sb.AppendLine($"Trạng thái: {session.Status}");
        sb.AppendLine($"Ngày tạo: {session.CreatedAt:dd/MM/yyyy HH:mm}");
        if (session.CompletedAt.HasValue)
            sb.AppendLine($"Ngày hoàn thành: {session.CompletedAt:dd/MM/yyyy HH:mm}");
        if (!string.IsNullOrWhiteSpace(session.Notes))
            sb.AppendLine($"Ghi chú: {session.Notes}");
        sb.AppendLine();

        sb.AppendLine("STT,Tên hàng hóa,SL dự kiến,SL thực tế,Chênh lệch,Lý do chênh lệch");
        var results = session.AuditResults.OrderBy(r => r.ResultId).ToList();
        for (int i = 0; i < results.Count; i++)
        {
            var r = results[i];
            var reason = r.DiscrepancyReason?.Replace(",", ";") ?? "";
            sb.AppendLine($"{i + 1},{r.ItemName},{r.ExpectedQty},{r.ActualQty},{r.Discrepancy},{reason}");
        }
        sb.AppendLine();

        sb.AppendLine("TỔNG KẾT");
        sb.AppendLine($"Tổng số mục,{results.Count}");
        sb.AppendLine($"Mục khớp,{results.Count(r => r.Discrepancy == 0)}");
        sb.AppendLine($"Mục chênh lệch,{results.Count(r => r.Discrepancy != 0)}");
        sb.AppendLine($"Tổng SL dự kiến,{results.Sum(r => r.ExpectedQty)}");
        sb.AppendLine($"Tổng SL thực tế,{results.Sum(r => r.ActualQty)}");
        sb.AppendLine($"Tổng chênh lệch,{results.Sum(r => r.Discrepancy ?? 0)}");

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        var fileName = $"BaoCaoKiemKe_{session.AuditId}_{DateTime.UtcNow:yyyyMMdd}.csv";

        return ApiResponse<ExportAuditReportResult>.SuccessResponse(
            new ExportAuditReportResult(bytes, fileName), "Xuất báo cáo kiểm kê thành công.");
    }
}
