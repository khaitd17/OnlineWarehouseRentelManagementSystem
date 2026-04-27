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

        try
        {
            var id = await _mediator.Send(command);
            return Ok(new
            {
                message = "Warehouse created successfully",
                warehouseId = id
            });
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
            Console.WriteLine($"[CreateWarehouse] ERROR: {ex.Message} | Inner: {inner}");
            return BadRequest(new { message = inner });
        }
    }

    [HttpGet("approved")]
    [AllowAnonymous]
    public async Task<IActionResult> GetApprovedWarehouses([FromQuery] int limit = 6)
    {
        var result = await _mediator.Send(new GetApprovedWarehousesQuery { Limit = limit });
        return Ok(result);
    }

    [HttpGet("approved/search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchWarehouses(
        [FromQuery] string?  province,
        [FromQuery] string?  district,
        [FromQuery] string?  warehouseType,
        [FromQuery] double?  minArea,
        [FromQuery] double?  maxArea,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool?    is24Hours,
        [FromQuery] double?  minRating,
        [FromQuery] string?  sortBy   = "newest",
        [FromQuery] int      page     = 1,
        [FromQuery] int      pageSize = 12)
    {
        var result = await _mediator.Send(new SearchWarehousesQuery
        {
            Province      = province,
            District      = district,
            WarehouseType = warehouseType,
            MinArea       = minArea,
            MaxArea       = maxArea,
            MinPrice      = minPrice,
            MaxPrice      = maxPrice,
            Is24Hours     = is24Hours,
            MinRating     = minRating,
            SortBy        = sortBy,
            Page          = page,
            PageSize      = pageSize
        });
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
        if (!ModelState.IsValid)
        {
            var errors = string.Join(" | ", ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage));
            Console.WriteLine($"[UpdateWarehouse] ModelState Invalid: {errors}");
            return BadRequest(new { message = "Dữ liệu không hợp lệ: " + errors });
        }

        if (id != command.WarehouseId)
            return BadRequest(new { message = "ID kho không khớp." });

        try
        {
            await _mediator.Send(command);
            return Ok(new { message = "Cập nhật kho thành công." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UpdateWarehouse] Error: {ex.Message}");
            return BadRequest(new { message = ex.Message });
        }
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

        return Ok(new { message = "Tải giấy tờ lên thành công" });
    }

    [HttpGet("{id}/documents")]
    public async Task<IActionResult> GetDocuments(int id)
    {
        var repo = HttpContext.RequestServices.GetRequiredService<WMS.Domain.Interfaces.IWarehouseDocumentRepository>();
        var docs = await repo.GetByWarehouseIdAsync(id, HttpContext.RequestAborted);
        return Ok(docs.Select(d => new
        {
            d.DocumentId,
            d.DocumentType,
            d.DocumentUrl,
            d.Status,
            d.CreatedAt
        }));
    }

    [HttpDelete("documents/{docId}")]
    public async Task<IActionResult> DeleteDocument(int docId)
    {
        var repo = HttpContext.RequestServices.GetRequiredService<WMS.Domain.Interfaces.IWarehouseDocumentRepository>();
        var result = await repo.DeleteAsync(docId, HttpContext.RequestAborted);
        if (!result) return NotFound();
        return Ok(new { message = "Xóa giấy tờ thành công" });
    }

    [HttpPatch("{id}/submit")]
    public async Task<IActionResult> SubmitWarehouse(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await _mediator.Send(new SubmitWarehouseCommand
        {
            WarehouseId = id,
            RequestUserId = int.Parse(userId)
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

    [HttpPatch("{id}/restore")]
    public async Task<IActionResult> RestoreWarehouse(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        try
        {
            await _mediator.Send(new WMS.Application.Features.Warehouses.RestoreWarehouse.RestoreWarehouseCommand
            {
                WarehouseId = id,
                CallerId = int.Parse(userId)
            });
            return Ok(new { message = "Thu hồi kho thành công" });
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