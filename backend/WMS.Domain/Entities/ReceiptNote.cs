namespace WMS.Domain.Entities;

/// <summary>
/// Phiếu nhập/xuất kho — ghi nhận thực tế mỗi lần hàng đến/đi.
/// Một InventoryRequest (yêu cầu) có thể sinh N ReceiptNote (phiếu).
/// Tồn kho chỉ được cập nhật khi phiếu ở trạng thái COMPLETED.
/// </summary>
public partial class ReceiptNote
{
    public int ReceiptNoteId { get; set; }

    /// <summary>FK về yêu cầu nhập/xuất kho gốc.</summary>
    public int InvReqId { get; set; }

    /// <summary>Mã phiếu — auto-generated, unique (VD: "RN-20260507-001A").</summary>
    public string ReceiptCode { get; set; } = null!;

    /// <summary>Staff thực hiện kiểm đếm và tạo phiếu.</summary>
    public int ReceivedByStaffId { get; set; }

    /// <summary>Thời điểm Staff tạo phiếu (hàng đến kho).</summary>
    public DateTime ReceivedAt { get; set; }

    /// <summary>Chữ ký Staff xác nhận đã kiểm đếm hàng.</summary>
    public string? StaffSignatureBase64 { get; set; }

    /// <summary>Chữ ký Renter xác nhận đồng ý kết quả kiểm đếm.</summary>
    public string? RenterSignatureBase64 { get; set; }

    /// <summary>
    /// Trạng thái phiếu:
    /// DRAFT    — Staff vừa tạo, chưa hoàn tất kiểm đếm
    /// VERIFIED — Staff đã kiểm đếm xong, chờ Renter xác nhận
    /// COMPLETED — Renter đã xác nhận → tồn kho được cập nhật
    /// </summary>
    public string Status { get; set; } = "DRAFT";

    public string? Notes { get; set; }

    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public virtual InventoryRequest InvReq { get; set; } = null!;
    public virtual User ReceivedByStaff { get; set; } = null!;
    public virtual ICollection<ReceiptItem> ReceiptItems { get; set; } = new List<ReceiptItem>();
}
