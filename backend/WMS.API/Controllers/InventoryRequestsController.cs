using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.InventoryRequests.ApproveRequest;
using WMS.Application.Features.InventoryRequests.AssignRequest;
using WMS.Application.Features.InventoryRequests.ConfirmRequest;
using WMS.Application.Features.InventoryRequests.CreateRequest;
using WMS.Application.Features.InventoryRequests.DeleteRequest;
using WMS.Application.Features.InventoryRequests.GetAssignedRequests;
using WMS.Application.Features.InventoryRequests.GetRequestById;
using WMS.Application.Features.InventoryRequests.GetRequests;
using WMS.Application.Features.InventoryRequests.GetOwnerInventoryRequests;
using WMS.Application.Features.InventoryRequests.RejectRequest;
using WMS.Application.Features.InventoryRequests.UpdateRequest;
using WMS.Application.Features.InventoryRequests.VerifyRequest;
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

        // Resolve viewAs: ưu tiên membership của kho cụ thể, fallback về membership đầu tiên của user
        string viewAs = "RENTER";

        if (warehouseId.HasValue)
        {
            // Có warehouseId → lấy role membership chính xác trong kho đó
            var membership = await _membershipRepo.GetCallerMembershipAsync(
                userId, warehouseId.Value, HttpContext.RequestAborted);
            if (membership != null)
                viewAs = membership.RoleCode;
        }

        // STAFF / MANAGER / OPERATOR phải cung cấp warehouseId — không được query toàn hệ thống
        if (viewAs is "STAFF" or "MANAGER" or "OPERATOR" && !warehouseId.HasValue)
            return BadRequest(new { message = "Vui lòng cung cấp warehouseId khi truy vấn với vai trò vận hành kho." });

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
        var staffId = GetUserId();
        var result  = await _mediator.Send(new GetAssignedRequestsQuery
        {
            StaffId     = staffId,
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

        // Bất kỳ OPERATOR / MANAGER / STAFF trong kho đều xác nhận được (không cần skill riêng)
        bool confirmIsOperator = await _membershipRepo.HasRoleAsync(staffId, request.WarehouseId, "OPERATOR", HttpContext.RequestAborted);
        bool confirmIsManager  = await _membershipRepo.HasRoleAsync(staffId, request.WarehouseId, "MANAGER",  HttpContext.RequestAborted);
        bool confirmIsStaff    = await _membershipRepo.HasRoleAsync(staffId, request.WarehouseId, "STAFF",    HttpContext.RequestAborted);

        if (!confirmIsOperator && !confirmIsManager && !confirmIsStaff)
            return StatusCode(403, new { message = "Chỉ thành viên vận hành kho (OPERATOR / MANAGER / STAFF) mới được xác nhận." });

        string confirmRole = confirmIsOperator ? "OPERATOR" : confirmIsManager ? "MANAGER" : "STAFF";

        try
        {
            var result = await _mediator.Send(new ConfirmInventoryRequestCommand
            {
                Id      = id,
                StaffId = staffId,
                Notes   = body?.Notes,
                Role    = confirmRole
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }


    [HttpPost("{id:int}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignRequestBody body)
    {
        var managerId = GetUserId();
        var request   = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        if (request == null) return NotFound(new { message = "Yêu cầu không tồn tại." });

        var membership = await _membershipRepo.GetCallerMembershipAsync(
            managerId, request.WarehouseId, HttpContext.RequestAborted);
        if (membership == null || membership.RoleCode is not ("MANAGER" or "OPERATOR"))
            return StatusCode(403, new { message = "Chỉ MANAGER / OPERATOR được giao việc." });

        // Kiểm tra staff được giao có thuộc kho này không
        var staffMembership = await _membershipRepo.GetCallerMembershipAsync(
            body.StaffId, request.WarehouseId, HttpContext.RequestAborted);
        if (staffMembership == null || staffMembership.RoleCode != "STAFF")
            return BadRequest(new { message = "Nhân viên được chọn không thuộc kho này hoặc không phải STAFF." });

        try
        {
            var result = await _mediator.Send(new AssignInventoryRequestCommand
            {
                Id        = id,
                ManagerId = managerId,
                StaffId   = body.StaffId,
                Note      = body.Note,
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex)    { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }


    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveRequestBody? body = null)
    {
        var managerId = GetUserId();
        var request = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        if (request == null) return NotFound(new { message = "Yêu cầu không tồn tại." });
        // Dùng HasRoleAsync để tránh bug priority khi user có cả OWNER+OPERATOR
        bool approveIsOperator = await _membershipRepo.HasRoleAsync(managerId, request.WarehouseId, "OPERATOR", HttpContext.RequestAborted);
        bool approveIsManager  = await _membershipRepo.HasRoleAsync(managerId, request.WarehouseId, "MANAGER",  HttpContext.RequestAborted);
        if (!approveIsOperator && !approveIsManager)
            return StatusCode(403, new { message = "Chỉ OPERATOR / MANAGER được duyệt." });
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
        // Dùng HasRoleAsync để tránh bug priority khi user có cả OWNER+OPERATOR
        bool rejectIsOperator = await _membershipRepo.HasRoleAsync(managerId, request.WarehouseId, "OPERATOR", HttpContext.RequestAborted);
        bool rejectIsManager  = await _membershipRepo.HasRoleAsync(managerId, request.WarehouseId, "MANAGER",  HttpContext.RequestAborted);
        if (!rejectIsOperator && !rejectIsManager)
            return StatusCode(403, new { message = "Chỉ OPERATOR / MANAGER được từ chối." });
        try
        {
            var result = await _mediator.Send(new RejectInventoryRequestCommand { Id = id, ManagerId = managerId, Reason = body?.Reason });
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>
    /// Staff xác minh số lượng hàng hóa thực tế (trước khi Confirm).
    /// Ghi lại VerifiedQuantity cho từng InventoryItem và trả về danh sách chênh lệch.
    /// Caller phải là STAFF / MANAGER / OPERATOR trong kho đó.
    /// </summary>
    [HttpPost("{id:int}/verify")]
    public async Task<IActionResult> Verify(int id, [FromBody] VerifyRequestBody body)
    {
        var staffId = GetUserId();

        var request = await _mediator.Send(new GetInventoryRequestByIdQuery { Id = id });
        if (request == null) return NotFound(new { message = "Yêu cầu không tồn tại." });

        // Chỉ thành viên vận hành kho mới được xác minh
        bool isOperator = await _membershipRepo.HasRoleAsync(staffId, request.WarehouseId, "OPERATOR", HttpContext.RequestAborted);
        bool isManager  = await _membershipRepo.HasRoleAsync(staffId, request.WarehouseId, "MANAGER",  HttpContext.RequestAborted);
        bool isStaff    = await _membershipRepo.HasRoleAsync(staffId, request.WarehouseId, "STAFF",    HttpContext.RequestAborted);

        if (!isOperator && !isManager && !isStaff)
            return StatusCode(403, new { message = "Chỉ thành viên vận hành kho (STAFF / MANAGER / OPERATOR) mới được xác minh hàng hóa." });

        if (body?.Items == null || body.Items.Count == 0)
            return BadRequest(new { message = "Danh sách xác minh không được để trống." });

        try
        {
            var result = await _mediator.Send(new VerifyInventoryRequestCommand
            {
                InvReqId = id,
                StaffId  = staffId,
                Items    = body.Items,
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
        catch (ArgumentException ex)          { return BadRequest(new { message = ex.Message }); }
    }
}

public record AssignRequestBody    { public int StaffId { get; init; } public string? Note { get; init; } }
public record ApproveRequestBody   { public string? Note    { get; init; } }
public record ConfirmRequestBody   { public string? Notes   { get; init; } }
public record RejectRequestBody    { public string? Reason   { get; init; } }
public record VerifyRequestBody    { public List<VerifyItemInput> Items { get; init; } = new(); }

