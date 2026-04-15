using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Subscriptions.Commands;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;

namespace WMS.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Require login
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly WMS.Domain.Interfaces.ISubscriptionPackageRepository _packageRepo;
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(
        IMediator mediator,
        WMS.Domain.Interfaces.ISubscriptionPackageRepository packageRepo,
        ISubscriptionService subscriptionService)
    {
        _mediator = mediator;
        _packageRepo = packageRepo;
        _subscriptionService = subscriptionService;
    }

    [HttpGet("packages")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPackages()
    {
        var packages = await _packageRepo.GetAllAsync();
        return Ok(new { success = true, data = packages.Where(p => p.IsActive).OrderBy(p => p.Price) });
    }

    /// <summary>
    /// Lấy trạng thái gói dịch vụ hiện tại của user đang đăng nhập
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        var userIdStr = User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var status = await _subscriptionService.GetUserSubscriptionStatusAsync(userId);
        return Ok(status);
    }

    [HttpGet("preview")]
    public async Task<IActionResult> GetPreview([FromQuery] string plan)
    {
        var userIdStr = User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var preview = await _subscriptionService.PreviewSubscriptionAsync(userId, plan);
        return Ok(preview);
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

