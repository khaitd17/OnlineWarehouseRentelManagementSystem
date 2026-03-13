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

        // ── USER STATS ──
        sb.AppendLine("THỐNG KÊ NGƯỜI DÙNG");
        sb.AppendLine("Chỉ số,Giá trị");
        sb.AppendLine($"Tổng người dùng,{await _db.Users.CountAsync(cancellationToken)}");
        sb.AppendLine($"Người dùng hoạt động,{await _db.Users.CountAsync(u => u.Status == "ACTIVE", cancellationToken)}");
        sb.AppendLine($"Người dùng bị khóa,{await _db.Users.CountAsync(u => u.Status == "LOCKED", cancellationToken)}");
        sb.AppendLine();

        // ── WAREHOUSE STATS ──
        sb.AppendLine("THỐNG KÊ KHO");
        sb.AppendLine("Chỉ số,Giá trị");
        sb.AppendLine($"Tổng số kho,{await _db.Warehouses.CountAsync(cancellationToken)}");
        sb.AppendLine($"Kho đã duyệt,{await _db.Warehouses.CountAsync(w => w.Status == "APPROVED", cancellationToken)}");
        sb.AppendLine($"Kho chờ duyệt,{await _db.Warehouses.CountAsync(w => w.Status == "PENDING", cancellationToken)}");
        sb.AppendLine();

        // ── CONTRACT & PAYMENT STATS ──
        sb.AppendLine("THỐNG KÊ HỢP ĐỒNG & THANH TOÁN");
        sb.AppendLine("Chỉ số,Giá trị");
        var totalContracts = await _db.Contracts.CountAsync(cancellationToken);
        var activeContracts = await _db.Contracts.CountAsync(c => c.Status == "ACTIVE", cancellationToken);
        sb.AppendLine($"Tổng hợp đồng,{totalContracts}");
        sb.AppendLine($"Hợp đồng đang hoạt động,{activeContracts}");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thirtyDaysLater = today.AddDays(30);
        var expiringContracts = await _db.Contracts
            .CountAsync(c => c.Status == "ACTIVE" && c.EndDate >= today && c.EndDate <= thirtyDaysLater, cancellationToken);
        sb.AppendLine($"Hợp đồng sắp hết hạn (30 ngày),{expiringContracts}");

        var totalRev = await _db.Payments.Where(p => p.Status == "PAID").SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var pendingPay = await _db.Payments.Where(p => p.Status == "PENDING").SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        var overduePay = await _db.Payments.Where(p => p.Status == "OVERDUE").SumAsync(p => (decimal?)p.Amount ?? 0, cancellationToken);
        sb.AppendLine($"Tổng doanh thu,{totalRev:N0}");
        sb.AppendLine($"Thanh toán chờ xử lý,{pendingPay:N0}");
        sb.AppendLine($"Thanh toán quá hạn,{overduePay:N0}");

        var totalPayable = totalRev + pendingPay + overduePay;
        var collectionRate = totalPayable > 0 ? Math.Round(totalRev / totalPayable * 100, 2) : 0m;
        sb.AppendLine($"Tỷ lệ thu tiền,{collectionRate}%");
        sb.AppendLine();

        // ── MONTHLY REVENUE ──
        sb.AppendLine("DOANH THU THEO THÁNG");
        sb.AppendLine("Tháng,Doanh thu");
        var rawMonthly = await _db.Payments
            .Where(p => p.Status == "PAID" && p.PaymentDate >= fromDate && p.PaymentDate <= toDate)
            .GroupBy(p => new { p.PaymentDate!.Value.Year, p.PaymentDate!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Amount = g.Sum(p => p.Amount) })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync(cancellationToken);

        foreach (var m in rawMonthly)
            sb.AppendLine($"{m.Year}-{m.Month:D2},{m.Amount:N0}");
        sb.AppendLine();

        // ── TOP WAREHOUSES BY REVENUE ──
        sb.AppendLine("TOP 5 KHO DOANH THU CAO NHẤT");
        sb.AppendLine("Tên kho,Doanh thu,Số hợp đồng");
        var topWarehouses = await _db.Payments
            .Where(p => p.Status == "PAID")
            .Include(p => p.Contract)
                .ThenInclude(c => c.Warehouse)
            .GroupBy(p => new { p.Contract.WarehouseId, p.Contract.Warehouse.Name })
            .Select(g => new
            {
                Name = g.Key.Name,
                Revenue = g.Sum(p => p.Amount),
                ContractCount = g.Select(p => p.ContractId).Distinct().Count()
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToListAsync(cancellationToken);

        foreach (var w in topWarehouses)
            sb.AppendLine($"{w.Name},{w.Revenue:N0},{w.ContractCount}");
        sb.AppendLine();

        // ── ALERTS ──
        sb.AppendLine("CẢNH BÁO HỆ THỐNG");
        sb.AppendLine("Mức độ,Tiêu đề,Nội dung");
        if (overduePay > 0)
            sb.AppendLine($"NGHIÊM TRỌNG,Thanh toán quá hạn,Có {overduePay:N0} VNĐ thanh toán đã quá hạn");
        if (expiringContracts > 0)
            sb.AppendLine($"CẢNH BÁO,Hợp đồng sắp hết hạn,Có {expiringContracts} hợp đồng hết hạn trong 30 ngày");
        if (collectionRate < 70 && collectionRate > 0)
            sb.AppendLine($"CẢNH BÁO,Tỷ lệ thu tiền thấp,Tỷ lệ thu tiền chỉ {collectionRate}%");

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return ApiResponse<byte[]>.SuccessResponse(bytes, "Xuất báo cáo thành công.");
    }
}
