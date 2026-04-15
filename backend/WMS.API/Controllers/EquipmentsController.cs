using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Features.Equipments.AddEquipment;
using WMS.Application.Features.Equipments.ControlEquipment;
using WMS.Application.Features.Equipments.DeleteEquipment;
using WMS.Application.Features.Equipments.GetEquipments;
using WMS.Application.Features.Equipments.UpdateEquipment;
using WMS.Application.Features.Equipments.UpdateEquipmentStatus;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EquipmentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;
    private readonly IStaffMembershipRepository _membershipRepo;

    public EquipmentsController(IMediator mediator, ApplicationDbContext db, IStaffMembershipRepository membershipRepo)
    {
        _mediator = mediator;
        _db = db;
        _membershipRepo = membershipRepo;
    }

    private int GetCurrentUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var id))
            return 0;
            
        return id;
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<IActionResult> GetByWarehouse(int warehouseId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var result = await _mediator.Send(new GetEquipmentsByWarehouseQuery 
            { 
                WarehouseId = warehouseId,
                RequestUserId = userId
            });
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                message = ex.Message, 
                detail = ex.InnerException?.Message
            });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddEquipmentCommand command)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            command.RequestUserId = userId;
            var id = await _mediator.Send(command);
            return Ok(new { id, message = "Equipment added successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                message = ex.Message, 
                detail = ex.InnerException?.Message
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEquipmentCommand command)
    {
        try
        {
            if (id != command.EquipmentId) return BadRequest();
            
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            command.RequestUserId = userId;
            await _mediator.Send(command);
            return Ok(new { message = "Equipment updated successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateEquipmentStatusCommand command)
    {
        try
        {
            if (id != command.EquipmentId) return BadRequest();
            
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            command.RequestUserId = userId;
            await _mediator.Send(command);
            return Ok(new { message = "Status updated successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            await _mediator.Send(new DeleteEquipmentCommand 
            { 
                EquipmentId = id,
                RequestUserId = userId
            });
            return Ok(new { message = "Equipment deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpPost("{id}/control")]
    public async Task<IActionResult> Control(int id, [FromBody] ControlEquipmentCommand command)
    {
        try
        {
            if (id != command.EquipmentId) return BadRequest();
            
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            command.RequestUserId = userId;
            var result = await _mediator.Send(command);
            return Ok(new { message = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    /// <summary>
    /// Sync trạng thái thiết bị Dùng Chung — chỉ OWNER hoặc OPERATOR của kho.
    /// </summary>
    [HttpPost("sync-shared/{warehouseId}")]
    public async Task<IActionResult> SyncSharedEquipmentStatus(int warehouseId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            // Chỉ OPERATOR của kho mới được trigger sync — OWNER không can thiệp vận hành
            var isOperator = await _membershipRepo.HasRoleAsync(
                userId, warehouseId, "OPERATOR", HttpContext.RequestAborted);
            if (!isOperator)
                return StatusCode(403, new { message = "Chỉ OPERATOR của kho mới được sync thiết bị." });

            var hasActiveContract = await _db.Contracts
                .AnyAsync(c => c.WarehouseId == warehouseId &&
                               (c.Status == "ACTIVE" || c.Status == "PENDING_PAYMENT"));

            var sharedEquipments = await _db.Equipments
                .Where(e => e.WarehouseId == warehouseId &&
                            e.RentalAreaId == null &&
                            e.Status != "DELETED" &&
                            e.Status != "RETIRED" &&
                            e.Status != "BROKEN" &&
                            e.Status != "MAINTENANCE")
                .ToListAsync();

            var targetStatus = hasActiveContract ? "IN_USE" : "AVAILABLE";
            var updatedCount = 0;

            foreach (var eq in sharedEquipments)
            {
                if (eq.Status != targetStatus)
                {
                    var previousStatus = eq.Status;
                    eq.Status = targetStatus;
                    eq.UpdatedAt = DateTime.UtcNow;

                    _db.EquipmentHistories.Add(new WMS.Domain.Entities.EquipmentHistory
                    {
                        EquipmentId = eq.EquipmentId,
                        PreviousStatus = previousStatus,
                        NewStatus = targetStatus,
                        Note = hasActiveContract
                            ? "Tự động chuyển IN_USE: Kho có hợp đồng đang hoạt động"
                            : "Tự động chuyển AVAILABLE: Kho không còn hợp đồng nào hoạt động"
                    });
                    updatedCount++;
                }
            }

            if (updatedCount > 0)
                await _db.SaveChangesAsync();

            return Ok(new
            {
                warehouseId,
                hasActiveContract,
                targetStatus,
                updatedCount,
                message = $"Đã cập nhật {updatedCount} thiết bị chung sang trạng thái {targetStatus}"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }
}
