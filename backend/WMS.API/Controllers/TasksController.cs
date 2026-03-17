using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Tasks.AssignTask;
using WMS.Application.Features.Tasks.CreateTask;
using WMS.Application.Features.Tasks.GetTaskTypes;
using WMS.Application.Features.Tasks.GetTasks;
using WMS.Application.Features.Tasks.ScheduleTask;

namespace WMS.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;

    public TasksController(IMediator mediator) => _mediator = mediator;

    private int? CallerUserId => int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] int warehouseId, [FromQuery] DateTime? weekStart, CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        try
        {
            var result = await _mediator.Send(new GetTasksQuery { CallerId = userId.Value, WarehouseId = warehouseId, WeekStart = weekStart }, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    [HttpGet("types")]
    public async Task<IActionResult> GetTaskTypes(CancellationToken ct)
        => Ok(await _mediator.Send(new GetTaskTypesQuery(), ct));

    [HttpPost("create")]
    public async Task<IActionResult> CreateTask([FromQuery] int warehouseId, [FromBody] CreateTaskCommand cmd, CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        cmd.CallerId = userId.Value;
        cmd.WarehouseId = warehouseId;
        try
        {
            var taskId = await _mediator.Send(cmd, ct);
            return Ok(new { message = "Task đã được tạo.", taskId });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}/schedule")]
    public async Task<IActionResult> Schedule(int id, [FromBody] ScheduleTaskCommand cmd, CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        cmd.TaskId = id;
        cmd.CallerId = userId.Value;
        try
        {
            await _mediator.Send(cmd, ct);
            return Ok(new { message = "Task đã được lên lịch." });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("{id}/unschedule")]
    public async Task<IActionResult> Unschedule(int id, CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        try
        {
            await _mediator.Send(new UnscheduleTaskCommand { TaskId = id, CallerId = userId.Value }, ct);
            return Ok(new { message = "Task đã được bỏ lịch." });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("{id}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignStaffCommand cmd, CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        cmd.TaskId = id;
        cmd.CallerId = userId.Value;
        try
        {
            await _mediator.Send(cmd, ct);
            return Ok(new { message = "Đã gán nhân viên vào task." });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("{id}/eligible-staff")]
    public async Task<IActionResult> GetEligibleStaff(int id, CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        try
        {
            var result = await _mediator.Send(new GetEligibleStaffQuery { TaskId = id, CallerId = userId.Value }, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
