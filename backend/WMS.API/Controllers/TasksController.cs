using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Tasks.CreateTask;
using WMS.Application.Features.Tasks.GetTaskTypes;
using WMS.Application.Features.Tasks.GetTasks;

namespace WMS.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;

    public TasksController(IMediator mediator) => _mediator = mediator;

    private int? CallerUserId => int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    // GET /api/tasks?warehouseId=&startDate=&endDate=
    [HttpGet]
    public async Task<IActionResult> GetTasks(
        [FromQuery] int warehouseId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        try
        {
            var start = startDate ?? DateTime.UtcNow.Date;
            var end   = endDate   ?? start.AddDays(30);
            var result = await _mediator.Send(new GetTasksQuery
            {
                CallerId    = userId.Value,
                WarehouseId = warehouseId,
                StartDate   = start,
                EndDate     = end,
            }, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    // GET /api/tasks/types
    [HttpGet("types")]
    public async Task<IActionResult> GetTaskTypes(CancellationToken ct)
        => Ok(await _mediator.Send(new GetTaskTypesQuery(), ct));

    // POST /api/tasks/create?warehouseId=
    [HttpPost("create")]
    public async Task<IActionResult> CreateTask(
        [FromQuery] int warehouseId,
        [FromBody] CreateTaskRequest body,
        CancellationToken ct)
    {
        var userId = CallerUserId;
        if (userId == null) return Unauthorized();
        try
        {
            var id = await _mediator.Send(new CreateTaskCommand
            {
                CallerId    = userId.Value,
                WarehouseId = warehouseId,
                TaskTypeId  = body.TaskTypeId,
                Note        = body.Note,
                ScheduledAt = body.ScheduledAt,
            }, ct);
            return Ok(new { id });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex)   { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex)        { return NotFound(new { message = ex.Message }); }
    }
}

// Request body cho CreateTask — tách khỏi Command để không expose internal logic ra API layer
public class CreateTaskRequest
{
    public int TaskTypeId    { get; set; }
    public string? Note      { get; set; }
    public DateTime? ScheduledAt { get; set; }
}
