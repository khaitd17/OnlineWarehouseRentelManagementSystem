using WMS.Domain.Entities;

namespace WMS.Application.Features.ReceiptNotes.Shared;

public record ReceiptItemDto
{
    public int ReceiptItemId { get; init; }
    public int? InventoryItemId { get; init; }
    public int? AssetId { get; init; }
    public string ItemName { get; init; } = "";
    public int ExpectedQuantity { get; init; }
    public int ReceivedQuantity { get; init; }
    public int Discrepancy => ReceivedQuantity - ExpectedQuantity;
    public string Unit { get; init; } = "";
    public decimal? VerifiedVolume { get; init; }
    public decimal? MeasuredLength { get; init; }
    public decimal? MeasuredWidth { get; init; }
    public decimal? VerifiedWeight { get; init; }
    public string? Note { get; init; }
}

public record ReceiptNoteDto
{
    public int ReceiptNoteId { get; init; }
    public int InvReqId { get; init; }
    public string? RequestCode { get; init; }
    public string ReceiptCode { get; init; } = "";
    public int ReceivedByStaffId { get; init; }
    public string? StaffName { get; init; }
    public DateTime ReceivedAt { get; init; }
    public string? StaffSignatureBase64 { get; init; }
    public string? RenterSignatureBase64 { get; init; }
    public string Status { get; init; } = "";
    public string? Notes { get; init; }
    public decimal? CapacityOverflow { get; init; }
    public DateTime? CreatedAt { get; init; }
    public bool HasDiscrepancy { get; init; }
    public List<ReceiptItemDto> Items { get; init; } = new();
}

public static class ReceiptNoteMapper
{
    public static ReceiptNoteDto ToDto(ReceiptNote n) => new()
    {
        ReceiptNoteId     = n.ReceiptNoteId,
        InvReqId          = n.InvReqId,
        RequestCode       = n.InvReq?.RequestCode,
        ReceiptCode       = n.ReceiptCode,
        ReceivedByStaffId = n.ReceivedByStaffId,
        StaffName         = n.ReceivedByStaff?.FullName,
        ReceivedAt        = n.ReceivedAt,
        StaffSignatureBase64 = n.StaffSignatureBase64,
        RenterSignatureBase64 = n.RenterSignatureBase64,
        Status            = n.Status,
        Notes             = n.Notes,
        CapacityOverflow  = n.CapacityOverflow,
        CreatedAt         = n.CreatedAt,
        HasDiscrepancy    = n.ReceiptItems.Any(i => i.ReceivedQuantity != i.ExpectedQuantity),
        Items             = n.ReceiptItems.Select(i => new ReceiptItemDto
        {
            ReceiptItemId    = i.ReceiptItemId,
            InventoryItemId  = i.InventoryItemId,
            AssetId          = i.AssetId,
            ItemName         = i.ItemName,
            ExpectedQuantity = i.ExpectedQuantity,
            ReceivedQuantity = i.ReceivedQuantity,
            Unit             = i.Unit,
            VerifiedVolume   = i.VerifiedVolume,
            MeasuredLength    = i.MeasuredLength,
            MeasuredWidth     = i.MeasuredWidth,
            VerifiedWeight   = i.VerifiedWeight,
            Note             = i.Note,
        }).ToList(),
    };
}
