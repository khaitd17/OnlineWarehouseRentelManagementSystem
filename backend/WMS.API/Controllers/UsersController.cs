using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Users.GetProfile;
using WMS.Application.Features.Users.UpdateProfile;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Xem thông tin profile của người dùng hiện tại</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        int userId = GetCurrentUserId();
        try
        {
            var profile = await _mediator.Send(new GetProfileQuery(userId));
            return Ok(profile);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Cập nhật thông tin profile của người dùng hiện tại</summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        int userId = GetCurrentUserId();
        try
        {
            await _mediator.Send(new UpdateProfileCommand(userId, req.FullName, req.Phone, req.AvatarUrl));
            return Ok(new { message = "Thông tin cá nhân đã được cập nhật." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return int.Parse(sub ?? throw new UnauthorizedAccessException("Không xác định được người dùng."));
    }
}

// ---- Request DTO ----
public record UpdateProfileRequest(string FullName, string? Phone, string? AvatarUrl);
