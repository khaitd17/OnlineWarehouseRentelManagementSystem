using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Features.Shifts.GetMySchedule;
using WMS.Application.Features.Shifts.GetShifts;
using WMS.Application.Features.Shifts.GetStaffSchedule;
using WMS.Application.Features.Shifts.SaveShifts;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[Route("api/schedule")]
[ApiController]
[Authorize]
public class ScheduleController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;

    public ScheduleController(IMediator mediator, ApplicationDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

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
    public async Task<IActionResult> GetWarehouseShifts([FromQuery] int warehouseId)
    {
        var shifts = await _db.WarehouseShifts
            .Where(s => s.WarehouseId == null || s.WarehouseId == warehouseId)
            .OrderBy(s => s.StartTime)
            .Select(s => new { s.Id, s.Name, s.StartTime, s.EndTime, s.WarehouseId })
            .ToListAsync();
        return Ok(shifts);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateSchedule([FromBody] GenerateRequest req, CancellationToken ct)
    {
        if (!DateOnly.TryParse(req.From, out var fromDate) || !DateOnly.TryParse(req.To, out var toDate))
            return BadRequest(new { message = "From / To phải đúng định dạng YYYY-MM-DD." });
        if (fromDate > toDate)
            return BadRequest(new { message = "From không được lớn hơn To." });

        var memberships = await _db.WarehouseMemberships
            .Include(m => m.Role)
            .Where(m => m.WarehouseId == req.WarehouseId && m.IsActive && m.WarehouseShiftId != null && m.Role.Code == "STAFF")
            .Include(m => m.WarehouseShift)
            .ToListAsync(ct);

        if (memberships.Count == 0)
            return Ok(new { message = "Không có nhân viên nào có loại ca được gán.", created = 0, skipped = 0 });

        var mids = memberships.Select(m => m.Id).ToList();
        var existing = await _db.StaffShifts
            .Where(s => mids.Contains(s.MembershipId) && s.ShiftDate >= fromDate && s.ShiftDate <= toDate)
            .Select(s => new { s.MembershipId, s.ShiftDate })
            .ToListAsync(ct);
        var existingSet = existing.Select(s => (s.MembershipId, s.ShiftDate)).ToHashSet();

        int created = 0, skipped = 0;
        for (var date = fromDate; date <= toDate; date = date.AddDays(1))
        {
            foreach (var m in memberships)
            {
                if (existingSet.Contains((m.Id, date))) { skipped++; continue; }
                _db.StaffShifts.Add(new WMS.Domain.Entities.StaffShift
                {
                    MembershipId = m.Id,
                    ShiftDate    = date,
                    TimeIn1      = m.WarehouseShift!.StartTime,
                    TimeOut1     = m.WarehouseShift!.EndTime,
                    TimeIn2      = null,
                    TimeOut2     = null,
                    ShiftType    = null,
                });
                created++;
            }
        }
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = $"Generate hoàn tất: {created} mới, {skipped} đã có.", created, skipped });
    }
}

public record GenerateRequest(int WarehouseId, string From, string To);
public record SaveShiftsRequest(List<UpsertShiftDto> Shifts);

