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
    private readonly IMediator _mediator;

    public RenterAssetsController(IRenterAssetRepository repo, IMediator mediator)
    {
        _repo     = repo;
        _mediator = mediator;
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
            Description   = input.Description,
        };
        var created = await _repo.CreateAsync(asset, ct);
        return CreatedAtAction(nameof(GetMyAssets), new
        {
            created.AssetId,
            created.AssetName,
            created.Unit,
            created.WeightPerUnit,
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
}

public record CreateAssetInput
{
    public string AssetName       { get; init; } = "";
    public string? Unit           { get; init; }
    public decimal? WeightPerUnit { get; init; }
    public string? Description    { get; init; }
}
