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
        var fromDate = request.FromDate ?? DateTime.UtcNow.AddMonths(-12);
        var toDate = request.ToDate ?? DateTime.UtcNow;
        var sb = new StringBuilder();

        sb.AppendLine("Báo Cáo Hệ Thống OWRMS");
        sb.AppendLine($"Từ ngày: {fromDate:dd/MM/yyyy},Đến ngày: {toDate:dd/MM/yyyy}");
        sb.AppendLine();

        sb.AppendLine("THỐNG KÊ NGƯỜI DÙNG");
        sb.AppendLine("Chỉ số,Giá trị");
        sb.AppendLine($"Tổng người dùng,{await _db.Users.CountAsync(cancellationToken)}");
        sb.AppendLine($"Người dùng hoạt động,{await _db.Users.CountAsync(u => u.Status == "ACTIVE", cancellationToken)}");
        sb.AppendLine($"Người dùng bị khóa,{await _db.Users.CountAsync(u => u.Status == "LOCKED", cancellationToken)}");
        sb.AppendLine();

        sb.AppendLine("THỐNG KÊ KHO");
        sb.AppendLine("Chỉ số,Giá trị");
        sb.AppendLine($"Tổng số kho,{await _db.Warehouses.CountAsync(cancellationToken)}");
        sb.AppendLine($"Kho đã duyệt,{await _db.Warehouses.CountAsync(w => w.Status == "APPROVED", cancellationToken)}");
        sb.AppendLine($"Kho chờ duyệt,{await _db.Warehouses.CountAsync(w => w.Status == "PENDING", cancellationToken)}");
        sb.AppendLine();

        sb.AppendLine("THỐNG KÊ HỢP ĐỒNG & THANH TOÁN");
        sb.AppendLine("Chỉ số,Giá trị");
        sb.AppendLine($"Tổng hợp đồng,{await _db.Contracts.CountAsync(cancellationToken)}");
        sb.AppendLine($"Hợp đồng đang hoạt động,{await _db.Contracts.CountAsync(c => c.Status == "ACTIVE", cancellationToken)}");
        var totalRev = await _db.Payments.Where(p => p.Status == "PAID").SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var pendingPay = await _db.Payments.Where(p => p.Status == "PENDING").SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var overduePay = await _db.Payments.Where(p => p.Status == "OVERDUE").SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        sb.AppendLine($"Tổng doanh thu,{totalRev:N0}");
        sb.AppendLine($"Thanh toán chờ xử lý,{pendingPay:N0}");
        sb.AppendLine($"Thanh toán quá hạn,{overduePay:N0}");
        sb.AppendLine();

        sb.AppendLine("DOANH THU THEO THÁNG");
        sb.AppendLine("Tháng,Doanh thu");
        var rawMonthly = await _db.Payments
            .Where(p => p.Status == "PAID" && p.PaymentDate >= fromDate && p.PaymentDate <= toDate)
            .GroupBy(p => new { p.PaymentDate!.Value.Year, p.PaymentDate!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Amount = g.Sum(p => p.Amount) })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync(cancellationToken);

        var monthlyRevenue = rawMonthly
            .Select(m => new { Period = $"{m.Year}-{m.Month:D2}", m.Amount })
            .ToList();

        foreach (var m in monthlyRevenue)
            sb.AppendLine($"{m.Period},{m.Amount:N0}");

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return ApiResponse<byte[]>.SuccessResponse(bytes, "Xuất báo cáo thành công.");
    }
}
