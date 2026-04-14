using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryRequestsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IStaffMembershipRepository _membershipRepo;

    public InventoryRequestsController(IMediator mediator, IStaffMembershipRepository membershipRepo)
    {
        _mediator = mediator;
        _membershipRepo = membershipRepo;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string type = "INBOUND",
        [FromQuery] string? status = null,
        [FromQuery] int? warehouseId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();

        // Lấy RoleCode trực tiếp từ membership — không quy đổi, handler tự xử lý
        string viewAs = "RENTER";
        if (warehouseId.HasValue)
        {
            var membership = await _membershipRepo.GetCallerMembershipAsync(
                userId, warehouseId.Value, HttpContext.RequestAborted);
            if (membership != null)
                viewAs = membership.RoleCode;
        }

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


    /// <summary>
    /// Xác nhận nhập/xuất vật lý. Caller phải là STAFF / MANAGER / OPERATOR trong kho đó.
    /// </summary>
    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmRequestBody? body = null)
    {
        var staffId = GetUserId();

        var request = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        if (request == null) return NotFound(new { message = "Yêu cầu không tồn tại." });

        var membership = await _membershipRepo.GetCallerMembershipAsync(
            staffId, request.WarehouseId, HttpContext.RequestAborted);

        if (membership == null || membership.RoleCode is not ("STAFF" or "MANAGER" or "OPERATOR"))
            return StatusCode(403, new { message = "Chỉ STAFF / MANAGER / OPERATOR mới được xác nhận." });

        // STAFF phải có skill CHECKER (hoặc IsAllSkill) để xác nhận nhập/xuất vật lý
        if (membership.RoleCode == "STAFF" && !membership.HasSkill("CHECKER"))
            return StatusCode(403, new { message = "Chỉ nhân viên có skill CHECKER (hoặc IsAllSkill) mới được xác nhận nhập/xuất vật lý." });

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


    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveRequestBody? body = null)
    {
        var managerId = GetUserId();
        var request = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        if (request == null) return NotFound(new { message = "Yêu cầu không tồn tại." });
        var membership = await _membershipRepo.GetCallerMembershipAsync(managerId, request.WarehouseId, HttpContext.RequestAborted);
        if (membership == null || membership.RoleCode is not ("MANAGER" or "OPERATOR"))
            return StatusCode(403, new { message = "Chỉ MANAGER / OPERATOR được duyệt." });
        try
        {
            var result = await _mediator.Send(new ApproveInventoryRequestCommand { Id = id, ManagerId = managerId, Note = body?.Note });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }



    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectRequestBody? body = null)
    {
        var managerId = GetUserId();
        var request = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        if (request == null) return NotFound(new { message = "Yêu cầu không tồn tại." });
        var membership = await _membershipRepo.GetCallerMembershipAsync(managerId, request.WarehouseId, HttpContext.RequestAborted);
        if (membership == null || membership.RoleCode is not ("MANAGER" or "OPERATOR"))
            return StatusCode(403, new { message = "Chỉ MANAGER / OPERATOR được từ chối." });
        try
        {
            var result = await _mediator.Send(new RejectInventoryRequestCommand { Id = id, ManagerId = managerId, Reason = body?.Reason });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}

public record ApproveRequestBody   { public string? Note    { get; init; } }
public record ConfirmRequestBody   { public string? Notes   { get; init; } }
public record RejectRequestBody    { public string? Reason   { get; init; } }

