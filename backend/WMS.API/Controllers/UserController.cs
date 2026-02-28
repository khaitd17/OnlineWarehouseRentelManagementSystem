using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Features.Users.Commands.UpdateAvatar;
using System.Security.Claims;

namespace WMS.API.Controllers;

[Authorize]
public class UserController : BaseController
{
    private readonly IMediator _mediator;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IApplicationDbContext _context;

    public UserController(IMediator mediator, ICloudinaryService cloudinaryService, IApplicationDbContext context)
    {
        _mediator = mediator;
        _cloudinaryService = cloudinaryService;
        _context = context;
    }

    [HttpPost("upload-avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded");

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdString, out var userId)) return Unauthorized();

        using var stream = file.OpenReadStream();
        var url = await _cloudinaryService.UploadImageAsync(stream, file.FileName, "avatars");

        if (url == null) return StatusCode(500, "Upload failed");

        var response = await _mediator.Send(new UpdateUserAvatarCommand(userId, url));
        return HandleResponse(response);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdString, out var userId)) return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return NotFound("User not found");

        return Ok(new {
            user.UserId,
            user.FullName,
            user.Email,
            user.Phone,
            user.AvatarUrl,
            user.Status,
            RoleName = user.Role.RoleName
        });
    }
}
