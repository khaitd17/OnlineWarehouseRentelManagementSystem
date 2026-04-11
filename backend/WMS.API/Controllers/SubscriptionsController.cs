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
    private readonly WMS.Domain.Interfaces.ISubscriptionPackageRepository _packageRepo;

    public SubscriptionsController(IMediator mediator, WMS.Domain.Interfaces.ISubscriptionPackageRepository packageRepo)
    {
        _mediator = mediator;
        _packageRepo = packageRepo;
    }

    [HttpGet("packages")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPackages()
    {
        var packages = await _packageRepo.GetAllAsync();
        return Ok(new { success = true, data = packages.Where(p => p.IsActive).OrderBy(p => p.Price) });
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
    public string Plan { get; set; } = null!;
}
