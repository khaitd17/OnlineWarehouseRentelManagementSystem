using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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

    [HttpGet("types")]
    public async Task<IActionResult> GetTaskTypes(CancellationToken ct)
        => Ok(await _mediator.Send(new GetTaskTypesQuery(), ct));

    [HttpGet("debug-tasks")]
    [AllowAnonymous]
    public async Task<IActionResult> DebugTasks(
        [FromServices] WMS.Infrastructure.Persistence.ApplicationDbContext db)
    {
        var tasks = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            System.Linq.Queryable.Select(db.WarehouseTasks, t => new {
                t.Id, t.WarehouseId, t.TaskTypeId, t.TaskType.Code,
                t.ScheduledAt, t.Status, t.RefType, t.RefId
            })
        );
        return Ok(tasks);
    }
}
