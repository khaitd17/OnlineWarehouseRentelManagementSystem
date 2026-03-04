using MediatR;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.Auth.ForgotPassword;
using WMS.Application.Features.Auth.Login;
using WMS.Application.Features.Auth.Register;
using WMS.Application.Features.Auth.ResetPassword;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Đăng ký tài khoản mới (role: Renter)</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        try
        {
            var userId = await _mediator.Send(new RegisterCommand(req.FullName, req.Email, req.Password, req.Phone));
            return StatusCode(201, new { message = "Đăng ký thành công.", userId });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Đăng nhập và nhận JWT token</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        try
        {
            var result = await _mediator.Send(new LoginCommand(req.Email, req.Password));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Yêu cầu gửi email đặt lại mật khẩu</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        await _mediator.Send(new ForgotPasswordCommand(req.Email));
        // Luôn trả 200 để không lộ email tồn tại hay không
        return Ok(new { message = "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." });
    }

    /// <summary>Đặt lại mật khẩu bằng token từ email</summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        try
        {
            await _mediator.Send(new ResetPasswordCommand(req.Token, req.NewPassword));
            return Ok(new { message = "Mật khẩu đã được cập nhật thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

// ---- Request DTOs ----
public record RegisterRequest(string FullName, string Email, string Password, string? Phone);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
