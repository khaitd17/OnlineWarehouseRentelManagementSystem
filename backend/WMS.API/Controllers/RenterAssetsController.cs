using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.RenterInventory.GetRenterInventory;
using WMS.Application.Features.RenterInventory.GetWarehouseInventoryForOwner;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/renter-assets")]
[Authorize]
public class RenterAssetsController : ControllerBase
{
    private readonly IRenterAssetRepository _repo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IMediator _mediator;

    public RenterAssetsController(IRenterAssetRepository repo, IRentalContractRepository contractRepo, IMediator mediator)
    {
        _repo         = repo;
        _contractRepo = contractRepo;
        _mediator     = mediator;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    /// <summary>Lấy danh sách tài sản (catalogue) của renter hiện tại</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyAssets(CancellationToken ct)
    {
        var userId = GetUserId();
        var assets = await _repo.GetByRenterAsync(userId, ct);
        return Ok(assets.Select(a => new
        {
            a.AssetId,
            a.AssetName,
            a.Unit,
            a.WeightPerUnit,
            a.VolumePerUnit,
            a.LengthPerUnit,
            a.WidthPerUnit,
            a.Description,
            a.CreatedAt
        }));
    }

    /// <summary>Tạo tài sản mới</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssetInput input, CancellationToken ct)
    {
        var userId = GetUserId();
        var asset = new RenterAsset
        {
            RenterId      = userId,
            AssetName     = input.AssetName.Trim(),
            Unit          = input.Unit ?? "cái",
            WeightPerUnit = input.WeightPerUnit,
            VolumePerUnit = input.VolumePerUnit,
            LengthPerUnit = input.LengthPerUnit,
            WidthPerUnit  = input.WidthPerUnit,
            Description   = input.Description,
        };
        var created = await _repo.CreateAsync(asset, ct);
        return CreatedAtAction(nameof(GetMyAssets), new
        {
            created.AssetId,
            created.AssetName,
            created.Unit,
            created.WeightPerUnit,
            created.VolumePerUnit,
            created.LengthPerUnit,
            created.WidthPerUnit,
            created.Description,
            created.CreatedAt
        });
    }

    /// <summary>Lấy tồn kho tại 1 warehouse cụ thể (API cũ)</summary>
    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventoryByWarehouse(
        [FromQuery] int warehouseId, CancellationToken ct)
    {
        var userId    = GetUserId();
        var inventory = await _repo.GetInventoryByWarehouseAsync(userId, warehouseId, ct);
        return Ok(inventory.Select(ri => new
        {
            ri.InventoryId,
            ri.AssetId,
            AssetName     = ri.Asset.AssetName,
            Unit          = ri.Asset.Unit,
            WeightPerUnit = ri.Asset.WeightPerUnit,
            VolumePerUnit = ri.Asset.VolumePerUnit,
            LengthPerUnit = ri.Asset.LengthPerUnit,
            WidthPerUnit  = ri.Asset.WidthPerUnit,
            ri.Quantity,
            ri.UpdatedAt
        }));
    }

    /// <summary>
    /// Renter xem toàn bộ tồn kho của mình.
    /// Logic xử lý trong GetRenterInventoryHandler.
    /// </summary>
    [HttpGet("my-inventory")]
    public async Task<IActionResult> GetMyInventory(
        [FromQuery] int? warehouseId, CancellationToken ct)
    {
        var rows = await _mediator.Send(
            new GetRenterInventoryQuery { RenterId = GetUserId(), WarehouseId = warehouseId }, ct);
        return Ok(rows);
    }

    /// <summary>
    /// Owner / Operator / Manager xem tồn kho của tất cả renter trong 1 kho.
    /// Kiểm tra quyền trong GetWarehouseInventoryForOwnerHandler qua WarehouseMembership.
    /// </summary>
    [HttpGet("warehouse-inventory")]
    public async Task<IActionResult> GetWarehouseInventory(
        [FromQuery] int warehouseId, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetWarehouseInventoryForOwnerQuery
            {
                RequestingUserId = GetUserId(),
                WarehouseId      = warehouseId
            }, ct);

        if (!result.IsAuthorized)
            return Forbid();

        return Ok(result.Rows);
    }

    /// <summary>
    /// Renter xem thông tin sức chứa tại 1 kho (đã dùng / còn trống).
    /// </summary>
    [HttpGet("capacity")]
    public async Task<IActionResult> GetCapacityInfo(
        [FromQuery] int warehouseId, CancellationToken ct)
    {
        var renterId = GetUserId();
        var contractedArea = await _contractRepo.GetContractedAreaAsync(renterId, warehouseId, ct);
        var usedArea = await _repo.GetUsedAreaAsync(renterId, warehouseId, ct);
        var remaining = (decimal)contractedArea - usedArea;
        return Ok(new
        {
            contractedArea,
            usedArea,
            remainingArea = remaining > 0 ? remaining : 0,
            usagePercent = contractedArea > 0 ? Math.Round((double)usedArea / contractedArea * 100, 1) : 0
        });
    }
}

public record CreateAssetInput
{
    public string AssetName       { get; init; } = "";
    public string? Unit           { get; init; }
    public decimal? WeightPerUnit { get; init; }
    public decimal? VolumePerUnit { get; init; }
    public decimal? LengthPerUnit { get; init; }
    public decimal? WidthPerUnit  { get; init; }
    public string? Description    { get; init; }
}
