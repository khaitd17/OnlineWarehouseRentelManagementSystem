using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Shifts.GenerateSchedule;
using WMS.Application.Features.Shifts.GetMySchedule;
using WMS.Application.Features.Shifts.GetShifts;
using WMS.Application.Features.Shifts.GetStaffSchedule;
using WMS.Application.Features.Shifts.GetWarehouseShifts;
using WMS.Application.Features.Shifts.SaveShifts;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers;

[Route("api/schedule")]
[ApiController]
[Authorize]
public class ScheduleController : ControllerBase
{
    private readonly IMediator _mediator;

    public ScheduleController(IMediator mediator) => _mediator = mediator;

    private int? GetCallerId()
    {
        var c = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(c, out var id) ? id : null;
    }

    [HttpGet("my-schedule")]
    public async Task<IActionResult> GetMySchedule(
        [FromQuery] int warehouseId,
        [FromQuery] string from,
        [FromQuery] string to,
        CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId == null) return Unauthorized();
        if (!DateOnly.TryParse(from, out var f) || !DateOnly.TryParse(to, out var t))
            return BadRequest(new { message = "from và to phải có dạng YYYY-MM-DD." });

        var result = await _mediator.Send(
            new GetMyScheduleCommand { CallerId = callerId.Value, WarehouseId = warehouseId, From = f, To = t }, ct);
        if (result == null) return NotFound(new { message = "Bạn không có membership trong kho này." });
        return Ok(result);
    }

    [HttpGet("staff")]
    public async Task<IActionResult> GetStaffSchedule(
        [FromQuery] int warehouseId,
        [FromQuery] string from,
        [FromQuery] string to,
        CancellationToken ct)
    {
        var callerId = GetCallerId();
        if (callerId == null) return Unauthorized();
        if (!DateOnly.TryParse(from, out var f) || !DateOnly.TryParse(to, out var t))
            return BadRequest(new { message = "from và to phải có dạng YYYY-MM-DD." });

        try
        {
            var result = await _mediator.Send(
                new GetStaffScheduleCommand { CallerId = callerId.Value, WarehouseId = warehouseId, From = f, To = t }, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    [HttpGet("shifts")]
    public async Task<IActionResult> GetShifts(
        [FromQuery] int warehouseId,
        [FromQuery] string from,
        [FromQuery] string to,
        CancellationToken ct)
    {
        if (!DateOnly.TryParse(from, out var f) || !DateOnly.TryParse(to, out var t))
            return BadRequest(new { message = "from và to phải có dạng YYYY-MM-DD." });
        var result = await _mediator.Send(new GetShiftsCommand { WarehouseId = warehouseId, From = f, To = t }, ct);
        return Ok(result);
    }

    [HttpPost("shifts")]
    public async Task<IActionResult> SaveShifts([FromBody] SaveShiftsRequest req, CancellationToken ct)
    {
        await _mediator.Send(new SaveShiftsCommand { Shifts = req.Shifts }, ct);
        return Ok(new { message = "Lưu lịch ca thành công." });
    }

    [HttpGet("warehouse-shifts")]
    public async Task<IActionResult> GetWarehouseShifts([FromQuery] int warehouseId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetWarehouseShiftsQuery { WarehouseId = warehouseId }, ct);
        return Ok(result);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateSchedule([FromBody] GenerateRequest req, CancellationToken ct)
    {
        if (!DateOnly.TryParse(req.From, out var fromDate) || !DateOnly.TryParse(req.To, out var toDate))
            return BadRequest(new { message = "From / To phải đúng định dạng YYYY-MM-DD." });
        if (fromDate > toDate)
            return BadRequest(new { message = "From không được lớn hơn To." });

        var result = await _mediator.Send(
            new GenerateScheduleCommand { WarehouseId = req.WarehouseId, From = fromDate, To = toDate }, ct);
        return Ok(new { message = result.Message, created = result.Created, skipped = result.Skipped });
    }
}

public record GenerateRequest(int WarehouseId, string From, string To);
public record SaveShiftsRequest(List<UpsertShiftDto> Shifts);
