using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.EquipmentIncidents.ReportIncident;
using WMS.Application.Features.EquipmentIncidents.UpdateIncidentStatus;
using WMS.Application.Features.EquipmentIncidents.GetIncidents;
using WMS.Application.Features.EquipmentIncidents.AddComment;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/equipment-incidents")]
[Authorize]
public class EquipmentIncidentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EquipmentIncidentsController(IMediator mediator)
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

    [HttpPost("report")]
    public async Task<IActionResult> Report([FromBody] ReportEquipmentIncidentCommand command)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            command.RequestUserId = userId;
            var id = await _mediator.Send(command);
            return Ok(new { id, message = "Báo cáo sự cố đã được gửi." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var result = await _mediator.Send(new GetIncidentDetailQuery { Id = id });
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<IActionResult> GetByWarehouse(int warehouseId, [FromQuery] string? status)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var result = await _mediator.Send(new GetIncidentsByWarehouseQuery 
            { 
                WarehouseId = warehouseId,
                Status = status,
                RequestUserId = userId
            });
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateIncidentStatusCommand command)
    {
        try
        {
            if (id != command.IncidentId) return BadRequest();
            
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            command.RequestUserId = userId;
            await _mediator.Send(command);
            return Ok(new { message = "Cập nhật trạng thái sự cố thành công." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddIncidentCommentCommand command)
    {
        try
        {
            if (id != command.IncidentId) return BadRequest();
            
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            command.RequestUserId = userId;
            await _mediator.Send(command);
            return Ok(new { message = "Đã thêm trao đổi." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
