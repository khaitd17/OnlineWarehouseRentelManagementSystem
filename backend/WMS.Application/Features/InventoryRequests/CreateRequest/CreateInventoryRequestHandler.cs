using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.CreateRequest;

// ─── Input DTOs ──────────────────────────────────────────────────────────────
public record CreateInventoryItemInput
{
    public string ItemName { get; init; } = "";
    public int Quantity { get; init; }
    public string Unit { get; init; } = "cái";
    public decimal? Weight { get; init; }
    public string? Description { get; init; }

    /// <summary>FK về catalogue renter_assets (nếu chọn từ catalogue)</summary>
    public int? AssetId { get; init; }
}

// ─── Command ─────────────────────────────────────────────────────────────────
public record CreateInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int RenterId { get; init; }
    public int WarehouseId { get; init; }
    public string Type { get; init; } = "INBOUND";    // INBOUND | OUTBOUND
    public string? Notes { get; init; }
    public List<string>? DocumentUrls { get; init; }
    public List<CreateInventoryItemInput> Items { get; init; } = new();
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class CreateInventoryRequestHandler
    : IRequestHandler<CreateInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;
    private readonly IWarehouseInventoryRepository _invRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IRenterAssetRepository _assetRepo;
    private readonly ITaskRepository _taskRepo;

    public CreateInventoryRequestHandler(
        IInventoryRequestRepository repo,
        IWarehouseInventoryRepository invRepo,
        IWarehouseRepository warehouseRepo,
        IRenterAssetRepository assetRepo,
        ITaskRepository taskRepo)
    {
        _repo          = repo;
        _invRepo       = invRepo;
        _warehouseRepo = warehouseRepo;
        _assetRepo     = assetRepo;
        _taskRepo      = taskRepo;
    }

    public async Task<InventoryRequestDto> Handle(
        CreateInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepo.GetByIdAsync(cmd.WarehouseId, cancellationToken);
        if (warehouse == null) throw new KeyNotFoundException("Warehouse not found");

        if (!warehouse.IsCurrentlyAccessible())
        {
            var timeStr = warehouse.Is24HoursAccess ? "24/7" : $"{warehouse.OpenTime} - {warehouse.CloseTime}";
            throw new InvalidOperationException(
                $"Kho hiện đang đóng cửa. Thời gian hoạt động: {timeStr}. Vui lòng thực hiện yêu cầu trong giờ làm việc.");
        }

        // Resolve asset info & build InventoryItems
        var inventoryItems = new List<InventoryItem>();
        foreach (var item in cmd.Items)
        {
            string itemName    = item.ItemName;
            string unit        = item.Unit;
            decimal? weight    = item.Weight;
            int? assetId       = item.AssetId;

            // If assetId provided, lookup catalogue to auto-fill
            if (assetId.HasValue && assetId.Value > 0)
            {
                var asset = await _assetRepo.GetByIdAsync(assetId.Value, cancellationToken);
                if (asset == null)
                    throw new KeyNotFoundException($"Asset #{assetId.Value} không tồn tại.");
                if (asset.RenterId != cmd.RenterId)
                    throw new UnauthorizedAccessException($"Asset #{assetId.Value} không thuộc về bạn.");

                itemName = asset.AssetName;
                unit     = asset.Unit;
                weight   = asset.WeightPerUnit.HasValue ? asset.WeightPerUnit * item.Quantity : item.Weight;
            }

            // OUTBOUND: check stock
            if (cmd.Type.ToUpper() == "OUTBOUND")
            {
                if (assetId.HasValue && assetId.Value > 0)
                {
                    // Check renter_inventory
                    var inventory = await _assetRepo.GetInventoryByRenterAsync(
                        cmd.RenterId, cmd.WarehouseId, cancellationToken);
                    var ri = inventory.FirstOrDefault(x => x.AssetId == assetId.Value);
                    var available = ri?.Quantity ?? 0;
                    if (available < item.Quantity)
                        throw new InvalidOperationException(
                            $"Không đủ tồn kho cho '{itemName}'. Hiện có: {available}, yêu cầu: {item.Quantity}.");
                }
                else
                {
                    // Fallback: check warehouse_inventory (text-based)
                    var inv = await _invRepo.GetAsync(cmd.WarehouseId, itemName, cancellationToken);
                    var available = inv?.Quantity ?? 0;
                    if (available < item.Quantity)
                        throw new InvalidOperationException(
                            $"Không đủ hàng tồn kho cho '{itemName}'. Hiện có: {available}, yêu cầu: {item.Quantity}.");
                }
            }

            inventoryItems.Add(new InventoryItem
            {
                ItemName    = itemName,
                Quantity    = item.Quantity,
                Unit        = unit,
                Weight      = weight,
                Description = item.Description,
                AssetId     = assetId,
            });
        }

        var request = new InventoryRequest
        {
            RenterId    = cmd.RenterId,
            WarehouseId = cmd.WarehouseId,
            Type        = cmd.Type.ToUpper(),
            Notes       = cmd.Notes,
            DocumentUrls = cmd.DocumentUrls != null && cmd.DocumentUrls.Count > 0
                ? System.Text.Json.JsonSerializer.Serialize(cmd.DocumentUrls)
                : null,
            Status         = "PENDING",
            InventoryItems = inventoryItems,
        };

        var created = await _repo.CreateAsync(request, cancellationToken);

        // Tự động tạo WarehouseTask + UnitTasks phản chiếu luồng nghiệp vụ
        await _taskRepo.CreateWorkflowTaskAsync(
            cmd.Type.ToUpper(),
            created.InvReqId,
            cmd.WarehouseId,
            created.CreatedAt,          // ScheduledAt gắn với ngày tạo đơn
            cancellationToken);

        var full = await _repo.GetByIdAsync(created.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(full!);
    }
}
