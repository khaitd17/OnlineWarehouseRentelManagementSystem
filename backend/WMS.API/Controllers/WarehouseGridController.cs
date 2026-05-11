using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using WMS.Application.Features.WarehouseGrid.GetGridInventoryStatus;
using WMS.Application.Features.WarehouseGrid.GetGridLocations;
using WMS.Application.Features.WarehouseGrid.GetPublicGridLocations;
using WMS.Application.Features.WarehouseGrid.GetGridRenters;
using WMS.Application.Features.WarehouseGrid.AssignGridLocations;
using WMS.Application.Features.WarehouseGrid.RemoveGridLocation;

namespace WMS.API.Controllers;

[Route("api/warehouses/{warehouseId}/grid-locations")]
[ApiController]
[Authorize]
public class WarehouseGridController : ControllerBase
{
    private readonly IMediator _mediator;

    public WarehouseGridController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("inventory-status")]
    public async Task<IActionResult> GetGridInventoryStatus(int warehouseId, CancellationToken ct)
    {
        try
        {
            var status = await _mediator.Send(new GetGridInventoryStatusQuery { WarehouseId = warehouseId }, ct);
            return Ok(status);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = ex.ToString() });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetGridLocations(int warehouseId, [FromQuery] int? renterId, CancellationToken ct)
    {
        try 
        {
            var result = await _mediator.Send(new GetGridLocationsQuery { WarehouseId = warehouseId, RenterId = renterId }, ct);
            return Ok(result);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = ex.ToString() });
        }
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicGridLocations(int warehouseId, CancellationToken ct)
    {
        try 
        {
            var result = await _mediator.Send(new GetPublicGridLocationsQuery { WarehouseId = warehouseId }, ct);
            return Ok(result);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = ex.ToString() });
        }
    }

    [HttpGet("renters")]
    public async Task<IActionResult> GetRenters(int warehouseId, CancellationToken ct)
    {
        try 
        {
            var renters = await _mediator.Send(new GetGridRentersQuery { WarehouseId = warehouseId }, ct);
            return Ok(renters);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = ex.ToString() });
        }
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignLocations(int warehouseId, [FromBody] AssignLocationReqDto req, CancellationToken ct)
    {
        await _mediator.Send(new AssignGridLocationsCommand
        {
            WarehouseId = warehouseId,
            Coordinates = req.Coordinates,
            AssetId = req.AssetId,
            ItemName = req.ItemName,
            RenterId = req.RenterId,
            Quantity = req.Quantity
        }, ct);
        return Ok(new { message = "Gán vị trí thành công." });
    }

    [HttpPost("remove")]
    public async Task<IActionResult> RemoveLocations(int warehouseId, [FromBody] RemoveLocationReqDto req, CancellationToken ct)
    {
        await _mediator.Send(new RemoveGridLocationCommand
        {
            WarehouseId = warehouseId,
            Id = req.Id,
            QuantityToRemove = req.QuantityToRemove
        }, ct);
        return Ok(new { message = "Cập nhật thành công." });
    }
}

public class AssignLocationReqDto
{
    public System.Collections.Generic.List<CoordinateDto> Coordinates { get; set; } = new();
    public int? AssetId { get; set; }
    public string? ItemName { get; set; }
    public int? RenterId { get; set; }
    public int Quantity { get; set; }
}

public class RemoveLocationReqDto
{
    public int Id { get; set; }
    public int QuantityToRemove { get; set; }
}
