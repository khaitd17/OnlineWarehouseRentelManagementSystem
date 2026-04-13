using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetSystemReports;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Admin;

public class ExportSystemReportsHandler : IRequestHandler<ExportSystemReportsQuery, ApiResponse<byte[]>>
{
    private readonly ApplicationDbContext _db;

    public ExportSystemReportsHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<byte[]>> Handle(ExportSystemReportsQuery request, CancellationToken cancellationToken)
    {
        var toDateRaw = request.ToDate ?? DateTime.UtcNow;
        var toDate = toDateRaw.Date.AddDays(1).AddTicks(-1);
        var fromDate = request.FromDate ?? toDate.Date.AddMonths(-12);
        var sb = new StringBuilder();

        sb.AppendLine("Báo Cáo Hệ Thống OWRMS");
        sb.AppendLine($"Từ ngày: {fromDate:dd/MM/yyyy},Đến ngày: {toDate:dd/MM/yyyy}");
        sb.AppendLine();

        // ── USER STATS ──
        sb.AppendLine("THỐNG KÊ NGƯỜI DÙNG");
        sb.AppendLine("Chỉ số,Giá trị");
        sb.AppendLine($"Tổng số người dùng,{await _db.Users.CountAsync(cancellationToken)}");
        sb.AppendLine($"Hoạt động,{await _db.Users.CountAsync(u => u.Status == "ACTIVE", cancellationToken)}");
        sb.AppendLine($"Bị khóa,{await _db.Users.CountAsync(u => u.Status == "LOCKED", cancellationToken)}");
        sb.AppendLine();

        // ── WAREHOUSE STATS ──
        sb.AppendLine("THỐNG KÊ KHO BÃI");
        sb.AppendLine("Chỉ số,Giá trị");
        sb.AppendLine($"Tổng số kho,{await _db.Warehouses.CountAsync(w => w.Status != "DELETED", cancellationToken)}");
        sb.AppendLine($"Trạng thái: Đã duyệt,{await _db.Warehouses.CountAsync(w => w.Status == "APPROVED", cancellationToken)}");
        sb.AppendLine($"Trạng thái: Chờ duyệt,{await _db.Warehouses.CountAsync(w => w.Status == "PENDING", cancellationToken)}");
        sb.AppendLine($"Trạng thái: Chưa công khai,{await _db.Warehouses.CountAsync(w => w.Status == "HIDDEN", cancellationToken)}");
        sb.AppendLine();

        // ── SUBSCRIPTION & FINANCIAL STATS ──
        sb.AppendLine("TÀI CHÍNH & DOANH THU GÓI CƯỚC");
        sb.AppendLine("Chỉ số,Giá trị");
        
        var subscriptions = await _db.Subscriptions
            .Where(s => (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Expired) && s.StartDate >= fromDate && s.StartDate <= toDate)
            .Join(_db.SubscriptionPackages, s => s.Plan, p => p.Name, (s, p) => new { Amount = p.Price })
            .ToListAsync(cancellationToken);
            
        var totalRevenue = subscriptions.Sum(x => x.Amount);
        
        var currentMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var totalNewSubscriptionsThisMonth = await _db.Subscriptions
            .CountAsync(s => s.StartDate >= currentMonthStart, cancellationToken);
            
        var nextSevenDays = DateTime.UtcNow.AddDays(7);
        var expiringSubscriptions = await _db.Subscriptions
            .CountAsync(s => s.Status == WMS.Domain.Entities.SubscriptionStatus.Active && s.EndDate <= nextSevenDays, cancellationToken);

        sb.AppendLine($"Tổng doanh thu (VNĐ),{totalRevenue}");
        sb.AppendLine($"Đăng ký mới (Tháng này),{totalNewSubscriptionsThisMonth}");
        sb.AppendLine($"Kho sắp hết gói cước,{expiringSubscriptions}");
        
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return ApiResponse<byte[]>.SuccessResponse(bytes, "Xuất báo cáo thành công.");
    }
}
