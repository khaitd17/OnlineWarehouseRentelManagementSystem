using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Features.InventoryRequests.ApproveRequest;
using WMS.Application.Features.InventoryRequests.ConfirmRequest;
using WMS.Application.Features.InventoryRequests.CreateRequest;
using WMS.Application.Features.InventoryRequests.DeleteRequest;
using WMS.Application.Features.InventoryRequests.GetAssignedRequests;
using WMS.Application.Features.InventoryRequests.GetRequestById;
using WMS.Application.Features.InventoryRequests.GetRequests;
using WMS.Application.Features.InventoryRequests.GetOwnerInventoryRequests;
using WMS.Application.Features.InventoryRequests.RejectRequest;
using WMS.Application.Features.InventoryRequests.UpdateRequest;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryRequestsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;

    public InventoryRequestsController(IMediator mediator, ApplicationDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    /// <summary>
    /// Lấy warehouse role thực từ DB (RENTER/STAFF/MANAGER/OWNER/OPERATOR).
    /// JWT chỉ lưu system role (USER/ADMIN), không phải warehouse role.
    /// </summary>
    private async Task<string> GetWarehouseRoleAsync(int userId)
    {
        var membership = await _db.WarehouseMemberships
            .Include(m => m.Role)
            .Where(m => m.UserId == userId && m.IsActive)
            .OrderByDescending(m => m.WarehouseRoleId) // MANAGER > STAFF priority
            .FirstOrDefaultAsync();

        return membership?.Role?.Code?.ToUpper() ?? "";
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string type = "INBOUND",
        [FromQuery] string? status = null,
        [FromQuery] int? warehouseId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        // Tra cứu warehouse role từ DB (JWT chỉ có system role USER/ADMIN)
        var role = await GetWarehouseRoleAsync(userId);

        var viewAs = role switch
        {
            "RENTER" => "RENTER",
            "STAFF" or "MANAGER" or "OPERATOR" => "STAFF",
            "OWNER" => "OWNER",
            _ => "STAFF"  // fallback: show all (safe default for unknown roles)
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


    [HttpGet("assigned-to-me")]
    public async Task<IActionResult> GetAssignedToMe(
        [FromQuery] int warehouseId,
        [FromQuery] string? type = null)
    {
        var result = await _mediator.Send(new GetAssignedRequestsQuery
        {
            WarehouseId = warehouseId,
            Type        = type?.ToUpper(),
        });
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        return result is null ? NotFound() : Ok(result);
    }

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


    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmRequestBody? body = null)
    {
        var staffId = GetUserId();
        var role = await GetWarehouseRoleAsync(staffId);
        try
        {
            var result = await _mediator.Send(new ConfirmInventoryRequestCommand
            {
                Id      = id,
                StaffId = staffId,
                Notes   = body?.Notes,
                Role    = role
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }


    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveRequestBody? body = null)
    {
        var managerId = GetUserId();
        var role = await GetWarehouseRoleAsync(managerId);
        try
        {
            var result = await _mediator.Send(new ApproveInventoryRequestCommand
            {
                Id        = id,
                ManagerId = managerId,
                Note      = body?.Note,
                Role      = role
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }




    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectRequestBody? body = null)
    {
        var managerId = GetUserId();
        var role = await GetWarehouseRoleAsync(managerId);
        try
        {
            var result = await _mediator.Send(new RejectInventoryRequestCommand
            {
                Id        = id,
                ManagerId = managerId,
                Reason    = body?.Reason,
                Role      = role
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}

public record ApproveRequestBody   { public string? Note    { get; init; } }
public record ConfirmRequestBody   { public string? Notes   { get; init; } }

public record RejectRequestBody    { public string? Reason   { get; init; } }
