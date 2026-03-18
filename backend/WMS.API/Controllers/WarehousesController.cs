using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Warehouses.CreateWarehouse;
using WMS.Application.Features.Warehouses.GetAllWarehouses;
using WMS.Application.Features.Warehouses.GetOwnerWarehouses;
using WMS.Application.Features.Warehouses.GetWarehouseDetail;
using WMS.Application.Features.Warehouses.UpdateWarehouse;
using WMS.Application.Features.Warehouses.GetOccupancyStats;
using WMS.Application.Features.Warehouses.DeleteWarehouse;
using WMS.Application.Features.Warehouses.DeleteWarehouseMedia;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarehouseController : ControllerBase
{
    private readonly IMediator _mediator;

    public WarehouseController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseCommand command)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        command.OwnerId = int.Parse(userId);

        var id = await _mediator.Send(command);

        return Ok(new
        {
            message = "Warehouse created successfully",
            warehouseId = id
        });
    }

    [HttpGet("approved")]
    [AllowAnonymous]
    public async Task<IActionResult> GetApprovedWarehouses([FromQuery] int limit = 6)
    {
        var result = await _mediator.Send(new GetApprovedWarehousesQuery { Limit = limit });
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await _mediator.Send(new GetWarehouseDetailQuery
        {
            WarehouseId = id
        });

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("owner/{ownerId}")]
    public async Task<IActionResult> GetOwnerWarehouses(int ownerId)
    {
        var result = await _mediator.Send(
            new GetOwnerWarehousesQuery(ownerId)
        );

        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWarehouse(int id, UpdateWarehouseCommand command)
    {
        if (id != command.WarehouseId)
            return BadRequest();

        await _mediator.Send(command);

        return Ok();
    }

    [HttpPost("{id}/media")]
    public async Task<IActionResult> UploadMedia(
        int id,
        [FromForm] AddWarehouseMediaCommand command)
    {
        command.WarehouseId = id;

        await _mediator.Send(command);

        return Ok();
    }

    [HttpPost("{id}/documents")]
    public async Task<IActionResult> UploadDocument(
        int id,
        [FromForm] AddWarehouseDocumentCommand command)
    {
        command.WarehouseId = id;

        await _mediator.Send(command);

        return Ok();
    }

    [HttpPatch("{id}/submit")]
    public async Task<IActionResult> SubmitWarehouse(int id)
    {
        await _mediator.Send(new SubmitWarehouseCommand
        {
            WarehouseId = id
        });

        return Ok(new
        {
            message = "Warehouse submitted for approval"
        });
    }

    [HttpGet("my-warehouses")]
    public async Task<IActionResult> GetMyWarehouses()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _mediator.Send(
            new GetOwnerWarehousesQuery(int.Parse(userId))
        );

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWarehouse(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            await _mediator.Send(new DeleteWarehouseCommand
            {
                WarehouseId = id,
                CallerId = int.Parse(userId)
            });
            return Ok(new { message = "Xóa kho thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("occupancy-stats")]
    public async Task<IActionResult> GetOccupancyStats()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _mediator.Send(new GetOccupancyStatsQuery(int.Parse(userId)));

        return Ok(result);
    }

    [HttpDelete("media/{mediaId}")]
    public async Task<IActionResult> DeleteMedia(int mediaId)
    {
        var result = await _mediator.Send(new DeleteWarehouseMediaCommand
        {
            MediaId = mediaId
        });

        if (!result)
            return NotFound();

        return Ok(new { message = "Media deleted successfully" });
    }
}