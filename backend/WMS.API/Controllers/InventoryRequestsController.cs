using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.InventoryRequests.ConfirmRequest;
using WMS.Application.Features.InventoryRequests.CreateRequest;
using WMS.Application.Features.InventoryRequests.DeleteRequest;
using WMS.Application.Features.InventoryRequests.GetRequestById;
using WMS.Application.Features.InventoryRequests.GetRequests;
using WMS.Application.Features.InventoryRequests.GetOwnerInventoryRequests;
using WMS.Application.Features.InventoryRequests.UpdateRequest;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryRequestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public InventoryRequestsController(IMediator mediator) => _mediator = mediator;

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    private string GetUserRole() =>
        User.FindFirst(ClaimTypes.Role)?.Value?.ToUpper()
        ?? User.FindFirst("role")?.Value?.ToUpper()
        ?? "";

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string type = "INBOUND",
        [FromQuery] string? status = null,
        [FromQuery] int? warehouseId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        var role   = GetUserRole();

        var viewAs = role switch
        {
            "RENTER" => "RENTER",
            "STAFF" or "MANAGER" => "STAFF",
            _ => "OWNER"
        };

        var result = await _mediator.Send(new GetInventoryRequestsQuery
        {
            ViewAs      = viewAs,
            UserId      = userId,
            Type        = type.ToUpper(),
            Status      = status?.ToUpper(),
            WarehouseId = warehouseId,
            Page        = page,
            PageSize    = pageSize,
        });
        return Ok(result);
    }

    // ── GET /api/InventoryRequests/owner (legacy endpoint — kept for frontend) ─
    /// <summary>Owner xem tất cả yêu cầu nhập/xuất kho</summary>
    [HttpGet("owner")]
    public async Task<IActionResult> GetOwnerRequests(
        [FromQuery] string type = "INBOUND",
        [FromQuery] string? status = null,
        [FromQuery] int? warehouseId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new GetOwnerInventoryRequestsQuery
        {
            OwnerId     = userId,
            Type        = type.ToUpper(),
            Status      = status?.ToUpper(),
            WarehouseId = warehouseId,
            Page        = page,
            PageSize    = pageSize,
        });
        return Ok(result);
    }

    // ── GET /api/InventoryRequests/{id} ───────────────────────────────────
    /// <summary>Lấy chi tiết một yêu cầu</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        return result is null ? NotFound() : Ok(result);
    }

    // ── POST /api/InventoryRequests ────────────────────────────────────────
    /// <summary>Renter tạo yêu cầu nhập hoặc xuất kho</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInventoryRequestCommand cmd)
    {
        var userId = GetUserId();
        var fullCmd = cmd with { RenterId = userId };
        try
        {
            var result = await _mediator.Send(fullCmd);
            return CreatedAtAction(nameof(GetById), new { id = result.InvReqId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── PUT /api/InventoryRequests/{id} ────────────────────────────────────
    /// <summary>Cập nhật yêu cầu (chỉ khi PENDING)</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateInventoryRequestCommand cmd)
    {
        var userId = GetUserId();
        try
        {
            var result = await _mediator.Send(cmd with { Id = id, RequestorId = userId });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    // ── DELETE /api/InventoryRequests/{id} ─────────────────────────────────
    /// <summary>Xóa yêu cầu (chỉ khi PENDING)</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        try
        {
            await _mediator.Send(new DeleteInventoryRequestCommand { Id = id, RequestorId = userId });
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return Forbid(ex.Message); }
    }

    // ── POST /api/InventoryRequests/{id}/confirm ───────────────────────────
    /// <summary>Staff xác nhận nhập/xuất kho → cập nhật tồn kho + tạo transaction</summary>
    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmRequestBody? body = null)
    {
        var staffId = GetUserId();
        try
        {
            var result = await _mediator.Send(new ConfirmInventoryRequestCommand
            {
                Id      = id,
                StaffId = staffId,
                Notes   = body?.Notes,
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}

public record ConfirmRequestBody
{
    public string? Notes { get; init; }
}
