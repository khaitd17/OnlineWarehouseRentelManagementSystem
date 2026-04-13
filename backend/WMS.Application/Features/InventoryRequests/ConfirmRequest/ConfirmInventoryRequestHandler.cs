using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.ConfirmRequest;

public record ConfirmInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int Id { get; init; }
    public int StaffId { get; init; }
    public string? Notes { get; init; }
}

public class ConfirmInventoryRequestHandler
    : IRequestHandler<ConfirmInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;
    private readonly IWarehouseInventoryRepository _invRepo;
    private readonly IInventoryTransactionRepository _txRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IRenterAssetRepository _assetRepo;
    private readonly ITaskRepository _taskRepo;

    public ConfirmInventoryRequestHandler(
        IInventoryRequestRepository repo,
        IWarehouseInventoryRepository invRepo,
        IInventoryTransactionRepository txRepo,
        IWarehouseRepository warehouseRepo,
        IRenterAssetRepository assetRepo,
        ITaskRepository taskRepo)
    {
        _repo          = repo;
        _invRepo       = invRepo;
        _txRepo        = txRepo;
        _warehouseRepo = warehouseRepo;
        _assetRepo     = assetRepo;
        _taskRepo      = taskRepo;
    }

    public async Task<InventoryRequestDto> Handle(
        ConfirmInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        // 1. Load request
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        // Check accessibility
        var warehouse = await _warehouseRepo.GetByIdAsync(req.WarehouseId, cancellationToken);
        if (warehouse != null && !warehouse.IsCurrentlyAccessible())
        {
            var timeStr = warehouse.Is24HoursAccess ? "24/7" : $"{warehouse.OpenTime} - {warehouse.CloseTime}";
            throw new InvalidOperationException(
                $"Không thể thực hiện giao dịch: Kho hiện đang đóng cửa. Giờ hoạt động: {timeStr}.");
        }

        // 2. Validate status — must be CONFIRMED for Staff to process
        if (req.Status != "CONFIRMED")
            throw new InvalidOperationException(
                $"Chỉ có thể xác nhận yêu cầu đã được duyệt (CONFIRMED). Trạng thái hiện tại: '{req.Status}'.");

        // 3. For each item: resolve AssetId, update inventory, create transaction
        foreach (var item in req.InventoryItems)
        {
            int delta = req.Type == "OUTBOUND" ? -item.Quantity : item.Quantity;

            // Update warehouse_inventory (text-based, backward compatible)
            await _invRepo.AdjustQuantityAsync(
                req.WarehouseId, item.ItemName, item.Unit, delta, cancellationToken);

            // --- Resolve AssetId nếu chưa có ---
            // Khi Renter gõ tên hàng mới (không chọn từ catalogue), AssetId = null.
            // Lúc này ta tự động tìm hoặc tạo RenterAsset để đảm bảo renter_inventory
            // luôn được cập nhật đầy đủ.
            int resolvedAssetId;

            if (item.AssetId.HasValue && item.AssetId.Value > 0)
            {
                resolvedAssetId = item.AssetId.Value;
            }
            else
            {
                // Tìm asset có cùng tên thuộc renter này
                var existingAsset = await _assetRepo.FindByNameAndRenterAsync(
                    req.RenterId, item.ItemName, cancellationToken);

                if (existingAsset != null)
                {
                    resolvedAssetId = existingAsset.AssetId;
                }
                else
                {
                    // Tạo mới RenterAsset từ thông tin của InventoryItem
                    var newAsset = await _assetRepo.CreateAsync(new RenterAsset
                    {
                        RenterId    = req.RenterId,
                        AssetName   = item.ItemName,
                        Unit        = item.Unit,
                        WeightPerUnit = item.Weight,
                        Description = item.Description,
                    }, cancellationToken);
                    resolvedAssetId = newAsset.AssetId;
                }

                // Gắn AssetId vào item để nhất quán cho lần sau
                item.AssetId = resolvedAssetId;
            }

            // Update renter_inventory (asset-based) — luôn thực hiện với resolvedAssetId
            await _assetRepo.AdjustRenterInventoryAsync(
                resolvedAssetId, req.WarehouseId, delta, cancellationToken);

            // 4. Create transaction record per item
            await _txRepo.CreateAsync(new InventoryTransaction
            {
                InvReqId    = req.InvReqId,
                Type        = req.Type,
                WarehouseId = req.WarehouseId,
                ItemName    = item.ItemName,
                Quantity    = item.Quantity,
                Unit        = item.Unit,
                PerformedBy = cmd.StaffId,
                Notes       = string.IsNullOrWhiteSpace(cmd.Notes) ? null : $"[Staff] {cmd.Notes}",
            }, cancellationToken);
        }

        // 5. Update request status to COMPLETED
        req.Status      = "COMPLETED";
        req.ConfirmedBy = cmd.StaffId;
        req.ConfirmedAt = DateTime.Now;
        req.UpdatedAt   = DateTime.Now;
        await _repo.UpdateAsync(req, cancellationToken);

        // Đóng UnitTask bước tiếp nhận hàng. Bước putaway/dispatch là màn hình riêng biệt.
        if (req.Type == "INBOUND")
        {
            try { await _taskRepo.CompleteUnitTaskAsync("INBOUND", req.InvReqId, "INBOUND_RECEIVE", cmd.StaffId, cancellationToken); } catch { }
        }
        else if (req.Type == "OUTBOUND")
        {
            try { await _taskRepo.CompleteUnitTaskAsync("OUTBOUND", req.InvReqId, "OUTBOUND_PICK", cmd.StaffId, cancellationToken); } catch { }
        }

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
