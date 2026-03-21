using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Features.Staff.CreateStaff;
using WMS.Application.Features.Staff.ListStaff;
using WMS.Application.Features.Staff.ReassignMembership;
using WMS.Application.Features.Staff.ToggleMembership;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;

    public StaffController(IMediator mediator, ApplicationDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    /// <summary>
    /// Tạo nhân viên mới và gán vào kho với role phù hợp.
    /// Chỉ OPERATOR và MANAGER mới được gọi API này.
    /// </summary>
    [HttpPost("create")]
    public async Task<IActionResult> CreateStaff(
        [FromBody] CreateStaffCommand command,
        CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            return Unauthorized(new { message = "User ID not found in token." });

        command.CallerId = callerId;

        try
        {
            var staffUserId = await _mediator.Send(command, ct);
            return Ok(new { message = "Nhân viên đã được tạo thành công.", staffUserId });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách nhân viên theo kho, tự động lọc theo scope của caller (role).
    /// </summary>
    [HttpGet("list")]
    public async Task<IActionResult> ListStaff(
        [FromQuery] int warehouseId,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            return Unauthorized(new { message = "User ID not found in token." });

        try
        {
            var query = new ListStaffQuery
            {
                WarehouseId = warehouseId,
                Search      = search,
                Page        = page,
                PageSize    = pageSize,
                CallerId    = callerId,
            };
            var result = await _mediator.Send(query, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Lấy membership của caller trong một kho (dùng để check quyền trên frontend).</summary>
    [HttpGet("my-membership")]
    public async Task<IActionResult> GetMyMembership(
        [FromQuery] int warehouseId,
        CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "User ID not found in token." });

        try
        {
            var query = new GetMyMembershipQuery { UserId = userId, WarehouseId = warehouseId };
            var result = await _mediator.Send(query, ct);
            if (result == null)
                return NotFound(new { message = "Bạn không có membership trong kho này." });
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>Lấy danh sách tất cả kho mà caller có quyền tạo nhân viên.</summary>
    [HttpGet("my-managed-warehouses")]
    public async Task<IActionResult> GetMyManagedWarehouses(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "User ID not found in token." });

        try
        {
            var query = new GetMyManagedWarehousesQuery { UserId = userId };
            var result = await _mediator.Send(query, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách skills và zones có trong một kho — dùng để render form thêm nhân viên.
    /// </summary>
    [HttpGet("warehouse-options")]
    public async Task<IActionResult> GetWarehouseOptions(
        [FromQuery] int warehouseId,
        CancellationToken ct)
    {
        var skills = await _db.Skills
            .Select(s => new { s.Id, s.Code, s.Name })
            .ToListAsync(ct);

        var zones = await _db.Zones
            .Where(z => z.WarehouseId == warehouseId && z.IsActive)
            .Select(z => new { z.Id, z.Code, z.Name })
            .ToListAsync(ct);

        return Ok(new { skills, zones });
    }

    /// <summary>Deactivate membership của nhân viên trong kho</summary>
    [HttpPost("deactivate")]
    public async Task<IActionResult> Deactivate([FromBody] ToggleMembershipRequest req, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            return Unauthorized(new { message = "User ID not found in token." });
        try
        {
            await _mediator.Send(new ToggleMembershipCommand { CallerId = callerId, MembershipId = req.MembershipId, SetActive = false }, ct);
            return Ok(new { message = "Đã deactivate nhân viên khỏi kho." });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    /// <summary>Activate lại membership của nhân viên trong kho</summary>
    [HttpPost("activate")]
    public async Task<IActionResult> Activate([FromBody] ToggleMembershipRequest req, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            return Unauthorized(new { message = "User ID not found in token." });
        try
        {
            await _mediator.Send(new ToggleMembershipCommand { CallerId = callerId, MembershipId = req.MembershipId, SetActive = true }, ct);
            return Ok(new { message = "Đã activate nhân viên trong kho." });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    /// <summary>Cập nhật (reassign) role, skills, zones của một membership.</summary>
    [HttpPut("reassign")]
    public async Task<IActionResult> Reassign(
        [FromBody] ReassignMembershipCommand command,
        CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            return Unauthorized(new { message = "User ID not found in token." });

        command.CallerId = callerId;

        try
        {
            await _mediator.Send(command, ct);
            return Ok(new { message = "Phân quyền đã được cập nhật thành công." });
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex)   { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("my-warehouses")]
    public async Task<IActionResult> MyWarehouses(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var list = await _db.WarehouseMemberships
            .Where(m => m.UserId == userId && m.IsActive)
            .Include(m => m.Role)
            .Include(m => m.Warehouse)
            .Select(m => new
            {
                warehouseId   = m.WarehouseId,
                warehouseName = m.Warehouse.Name,
                roleCode      = m.Role.Code,
                hasZone       = m.Warehouse.HasZone,
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    [HttpGet("scoped-list")]
    public async Task<IActionResult> ScopedList([FromQuery] int warehouseId, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            return Unauthorized(new { message = "User ID not found in token." });

        // Alias của /list — giữ route để tương thích với frontend
        try
        {
            var query = new ListStaffQuery
            {
                WarehouseId = warehouseId,
                Page        = 1,
                PageSize    = 1000,   // shift scheduling cần tất cả (không paginate)
                CallerId    = callerId,
            };
            var result = await _mediator.Send(query, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

}

public record ToggleMembershipRequest(int MembershipId);
