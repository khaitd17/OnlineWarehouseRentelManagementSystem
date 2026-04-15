using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.VerifyRequest;

// ─── Input per item ───────────────────────────────────────────────────────────
public record VerifyItemInput
{
    /// <summary>ID của InventoryItem cần xác minh.</summary>
    public int ItemId { get; init; }

    /// <summary>Số lượng thực tế Staff kiểm đếm được.</summary>
    public int VerifiedQuantity { get; init; }

    /// <summary>Ghi chú của Staff (tùy chọn). VD: "Thiếu 2 thùng do hàng bị hỏng".</summary>
    public string? VerifyNote { get; init; }
}

// ─── Command ─────────────────────────────────────────────────────────────────
public record VerifyInventoryRequestCommand : IRequest<VerifyInventoryResultDto>
{
    public int InvReqId { get; init; }
    public int StaffId  { get; init; }
    public List<VerifyItemInput> Items { get; init; } = new();
}

// ─── Result DTO ──────────────────────────────────────────────────────────────
public record VerifyInventoryResultDto
{
    public int InvReqId { get; init; }
    public bool HasDiscrepancy { get; init; }
    public List<VerifyItemResultDto> Items { get; init; } = new();
}

public record VerifyItemResultDto
{
    public int    ItemId           { get; init; }
    public string ItemName         { get; init; } = "";
    public int    RequestedQty     { get; init; }
    public int    VerifiedQty      { get; init; }
    public int    Discrepancy      { get; init; }     // VerifiedQty - RequestedQty (âm = thiếu, dương = thừa)
    public string? VerifyNote      { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class VerifyInventoryRequestHandler
    : IRequestHandler<VerifyInventoryRequestCommand, VerifyInventoryResultDto>
{
    private readonly IInventoryRequestRepository _repo;

    public VerifyInventoryRequestHandler(IInventoryRequestRepository repo)
        => _repo = repo;

    public async Task<VerifyInventoryResultDto> Handle(
        VerifyInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        // 1. Load yêu cầu
        var req = await _repo.GetByIdAsync(cmd.InvReqId, cancellationToken)
            ?? throw new KeyNotFoundException($"Inventory request #{cmd.InvReqId} không tồn tại.");

        // 2. Validate: chỉ cho phép khi CONFIRMED hoặc ASSIGNED
        if (req.Status != "CONFIRMED" && req.Status != "ASSIGNED")
            throw new InvalidOperationException(
                $"Chỉ có thể xác minh yêu cầu ở trạng thái CONFIRMED hoặc ASSIGNED. Trạng thái hiện tại: '{req.Status}'.");

        // 3. Build lookup để match ItemId
        var itemLookup = req.InventoryItems.ToDictionary(i => i.ItemId);

        // 4. Validate: tất cả ItemId trong cmd phải thuộc request này
        foreach (var input in cmd.Items)
        {
            if (!itemLookup.ContainsKey(input.ItemId))
                throw new InvalidOperationException(
                    $"ItemId {input.ItemId} không thuộc về yêu cầu #{cmd.InvReqId}.");

            if (input.VerifiedQuantity < 0)
                throw new ArgumentException(
                    $"Số lượng thực tế không được âm (ItemId: {input.ItemId}).");
        }

        // 5. Cập nhật VerifiedQuantity và VerifyNote cho từng item
        foreach (var input in cmd.Items)
        {
            var item = itemLookup[input.ItemId];
            item.VerifiedQuantity = input.VerifiedQuantity;
            item.VerifyNote       = string.IsNullOrWhiteSpace(input.VerifyNote)
                ? null
                : input.VerifyNote.Trim();
        }

        // 6. Lưu thay đổi
        await _repo.UpdateAsync(req, cancellationToken);

        // 7. Build result — trả về danh sách chênh lệch
        var results = req.InventoryItems.Select(item =>
        {
            // Nếu item không có trong cmd.Items thì VerifiedQuantity có thể vẫn là null (chưa verify item đó)
            var verifiedQty = item.VerifiedQuantity ?? item.Quantity; // default = quantity nếu chưa verify
            return new VerifyItemResultDto
            {
                ItemId       = item.ItemId,
                ItemName     = item.ItemName,
                RequestedQty = item.Quantity,
                VerifiedQty  = verifiedQty,
                Discrepancy  = verifiedQty - item.Quantity,
                VerifyNote   = item.VerifyNote,
            };
        }).ToList();

        bool hasDiscrepancy = results.Any(r => r.Discrepancy != 0);

        return new VerifyInventoryResultDto
        {
            InvReqId       = cmd.InvReqId,
            HasDiscrepancy = hasDiscrepancy,
            Items          = results,
        };
    }
}
