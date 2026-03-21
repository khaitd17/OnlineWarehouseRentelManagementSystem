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

    public CreateInventoryRequestHandler(
        IInventoryRequestRepository repo,
        IWarehouseInventoryRepository invRepo,
        IWarehouseRepository warehouseRepo)
    {
        _repo    = repo;
        _invRepo = invRepo;
        _warehouseRepo = warehouseRepo;
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

        // For OUTBOUND: pre-check each item's inventory before creating request
        if (cmd.Type.ToUpper() == "OUTBOUND")
        {
            foreach (var item in cmd.Items)
            {
                var inv = await _invRepo.GetAsync(cmd.WarehouseId, item.ItemName, cancellationToken);
                var available = inv?.Quantity ?? 0;
                if (available < item.Quantity)
                    throw new InvalidOperationException(
                        $"Không đủ hàng tồn kho cho '{item.ItemName}'. " +
                        $"Hiện có: {available}, yêu cầu: {item.Quantity}.");
            }
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
            Status      = "PENDING",
            InventoryItems = cmd.Items.Select(i => new InventoryItem
            {
                ItemName    = i.ItemName,
                Quantity    = i.Quantity,
                Unit        = i.Unit,
                Weight      = i.Weight,
                Description = i.Description,
            }).ToList()
        };

        var created = await _repo.CreateAsync(request, cancellationToken);
        var full    = await _repo.GetByIdAsync(created.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(full!);
    }
}
