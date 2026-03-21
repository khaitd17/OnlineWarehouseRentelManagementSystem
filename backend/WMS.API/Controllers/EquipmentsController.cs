using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Equipments.AddEquipment;
using WMS.Application.Features.Equipments.ControlEquipment;
using WMS.Application.Features.Equipments.DeleteEquipment;
using WMS.Application.Features.Equipments.GetEquipments;
using WMS.Application.Features.Equipments.UpdateEquipment;
using WMS.Application.Features.Equipments.UpdateEquipmentStatus;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EquipmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EquipmentsController(IMediator mediator)
    {
        _mediator = mediator;
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
                detail = ex.InnerException?.Message,
                stackTrace = ex.StackTrace,
                type = ex.GetType().Name
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
                detail = ex.InnerException?.Message,
                stackTrace = ex.StackTrace,
                type = ex.GetType().Name
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
            return StatusCode(500, new 
            { 
                message = ex.Message, 
                detail = ex.InnerException?.Message,
                stackTrace = ex.StackTrace,
                type = ex.GetType().Name
            });
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
            return StatusCode(500, new 
            { 
                message = ex.Message, 
                detail = ex.InnerException?.Message,
                stackTrace = ex.StackTrace,
                type = ex.GetType().Name
            });
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
            return StatusCode(500, new 
            { 
                message = ex.Message, 
                detail = ex.InnerException?.Message,
                stackTrace = ex.StackTrace,
                type = ex.GetType().Name
            });
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
            return StatusCode(500, new 
            { 
                message = ex.Message, 
                detail = ex.InnerException?.Message,
                stackTrace = ex.StackTrace,
                type = ex.GetType().Name
            });
        }
    }
}
