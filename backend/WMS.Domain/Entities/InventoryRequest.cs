using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class InventoryRequest
{
    public int InvReqId { get; set; }

    public int RenterId { get; set; }

    public int WarehouseId { get; set; }

    public string Type { get; set; } = null!;

    public string? Status { get; set; }

    /// <summary>Mã yêu cầu — auto-generated, unique (VD: "INB-20260507-001").</summary>
    public string? RequestCode { get; set; }

    public int? ConfirmedBy { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public int? AssignedStaffId { get; set; }

    public string? AssignedNote { get; set; }

    public DateTime? AssignedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ScheduledDate { get; set; }

    public string? Notes { get; set; }

    /// <summary>Chữ ký Renter — giữ lại để backward-compatible nhưng không bắt buộc khi tạo yêu cầu nữa.</summary>
    public string? RenterSignatureBase64 { get; set; }
    public string? ManagerSignatureBase64 { get; set; }
    /// <summary>Chữ ký Staff — giữ lại cho backward-compatible, phiếu nhập mới sẽ dùng ReceiptNote.StaffSignatureBase64.</summary>
    public string? StaffSignatureBase64 { get; set; }

    public string? DocumentUrls { get; set; }

    /// <summary>Cờ cảnh báo thể tích vượt ngưỡng (soft warning, không block).</summary>
    public bool VolumeWarning { get; set; } = false;

    public virtual User? ConfirmedByNavigation { get; set; }
    public virtual User? AssignedStaff { get; set; }

    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();

    /// <summary>Danh sách phiếu nhập/xuất kho thực tế (1:N).</summary>
    public virtual ICollection<ReceiptNote> ReceiptNotes { get; set; } = new List<ReceiptNote>();

    public virtual User Renter { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;
}
