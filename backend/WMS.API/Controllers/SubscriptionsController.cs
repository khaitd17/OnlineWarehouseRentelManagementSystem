using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Subscriptions.Commands;
using WMS.Domain.Entities;

namespace WMS.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Require login
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SubscriptionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionRequest request)
    {
        // Get user id from token
        var userIdStr = User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var command = new CreateSubscriptionCommand
        {
            UserId = userId,
            Plan = request.Plan
        };

        var result = await _mediator.Send(command);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(result);
    }
}

public class CreateSubscriptionRequest
{
    public SubscriptionPlan Plan { get; set; }
}
