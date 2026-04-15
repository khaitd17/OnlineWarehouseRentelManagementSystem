using BCrypt.Net;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;
using WMS.Application.Features.Auth.ForgotPassword;
using WMS.Application.Features.Auth.Login;
using WMS.Application.Features.Auth.Register;
using WMS.Application.Features.Auth.ResetPassword;
using WMS.Application.Interfaces;
using WMS.Infrastructure.Persistence;


namespace WMS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly IEmailService _emailService;

    public AuthController(IMediator mediator, ApplicationDbContext db, IMemoryCache cache, IEmailService emailService)
    {
        _mediator = mediator;
        _db = db;
        _cache = cache;
        _emailService = emailService;
    }

    /// <summary>Gửi OTP xác thực email khi đăng ký</summary>
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Email không hợp lệ." });

        // Kiểm tra email đã tồn tại
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (existing != null)
            return Conflict(new { message = "Email này đã được sử dụng." });

        // Sinh OTP 6 số
        var otp = new Random().Next(100000, 999999).ToString();

        // Lưu OTP + thông tin đăng ký vào cache (TTL 10 phút)
        var cacheKey = $"otp:register:{req.Email.ToLower()}";
        _cache.Set(cacheKey, new OtpRegisterPayload
        {
            Otp = otp,
            FullName = req.FullName,
            Phone = req.Phone,
            Password = req.Password,
            RoleName = req.RoleName ?? "USER"
        }, TimeSpan.FromMinutes(10));

        // Gửi email OTP
        await _emailService.SendOtpEmailAsync(req.Email, req.FullName, otp);

        return Ok(new { message = "Mã OTP đã được gửi đến email của bạn." });
    }

    /// <summary>Xác minh OTP và tạo tài khoản</summary>
    [HttpPost("verify-otp-register")]
    public async Task<IActionResult> VerifyOtpRegister([FromBody] RegisterVerifyOtpRequest req)
    {
        var cacheKey = $"otp:register:{req.Email.ToLower()}";
        if (!_cache.TryGetValue(cacheKey, out OtpRegisterPayload? payload) || payload == null)
            return BadRequest(new { message = "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." });

        if (payload.Otp != req.Otp)
            return BadRequest(new { message = "Mã OTP không đúng. Vui lòng kiểm tra lại." });

        // Xóa OTP khỏi cache
        _cache.Remove(cacheKey);

        // Tạo tài khoản
        try
        {
            var userId = await _mediator.Send(new RegisterCommand(
                payload.FullName, req.Email, payload.Password, payload.Phone, payload.RoleName));
            return Ok(new { message = "Tạo tài khoản thành công.", userId });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Đăng ký tài khoản mới (role: USER)</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        try
        {
            var userId = await _mediator.Send(new RegisterCommand(req.FullName, req.Email, req.Password, req.Phone, req.RoleName));
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

    /// <summary>Lấy thông tin bối cảnh kho của người dùng hiện tại</summary>
    [HttpGet("warehouse-context")]
    [Authorize]
    public async Task<IActionResult> GetWarehouseContext()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "User ID not found in token." });

            var user = await _db.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound(new { message = "User not found." });

            var memberships = await _db.WarehouseMemberships
                .Where(m => m.UserId == userId && m.IsActive)
                .Include(m => m.Warehouse)
                .Include(m => m.Role)
                .Include(m => m.Skills)
                .ToListAsync();

            // Include warehouses where the user has an active/pending rental contract (RENTER role)
            var activeContracts = await _db.Contracts
                .Where(c => c.RenterId == userId &&
                           (c.Status == "ACTIVE" || c.Status == "PENDING_PAYMENT"))
                .Include(c => c.Warehouse)
                .ToListAsync();

            var activeRenterWarehouseIds = activeContracts.Select(c => c.WarehouseId).ToHashSet();

            // Lọc ra các membership RENTER nhưng không còn hợp đồng active
            var filteredMemberships = memberships.Where(m =>
                (m.Role?.Code ?? "").ToUpper() != "RENTER" || activeRenterWarehouseIds.Contains(m.WarehouseId)
            ).ToList();

            // Gom nhóm theo warehouseId — khi user có OWNER + OPERATOR trong cùng 1 kho
            // → 'role' = role cao nhất (để hiển thị), 'roles' = tất cả role codes (để check quyền)
            var rolePriority = new[] { "OWNER", "OPERATOR", "MANAGER", "STAFF", "RENTER" };

            var warehouseItems = filteredMemberships
                .GroupBy(m => m.WarehouseId)
                .Select(g =>
                {
                    var best = g.OrderBy(m =>
                    {
                        var idx = Array.IndexOf(rolePriority, m.Role?.Code ?? "");
                        return idx < 0 ? 999 : idx;
                    }).First();

                    // Thu thập tất cả role codes trong kho này
                    var allRoleCodes = g
                        .Select(m => m.Role?.Code ?? "")
                        .Where(c => !string.IsNullOrEmpty(c))
                        .Distinct()
                        .OrderBy(c => Array.IndexOf(rolePriority, c)) // sắp xếp theo priority
                        .ToList();

                    // Merge skills từ tất cả memberships
                    var mergedSkills = g
                        .SelectMany(m => m.Skills.Select(s => s.Code))
                        .Distinct()
                        .ToList();

                    // isAllSkill = true nếu bất kỳ membership nào trong kho có isAllSkill
                    var mergedIsAllSkill = g.Any(m => m.IsAllSkill);

                    return new WarehouseContextItem
                    {
                        warehouseId = best.WarehouseId,
                        warehouseName = best.Warehouse?.Name ?? "",
                        role = best.Role?.Code ?? "",   // role cao nhất — dùng để hiển thị label
                        roles = allRoleCodes,             // tất cả role — dùng để kiểm tra quyền
                        skills = mergedSkills,             // skills gộp từ tất cả memberships
                        isAllSkill = mergedIsAllSkill,
                    };
                }).ToList();

            // Include warehouses where the user has an active/pending rental contract (RENTER role)
            // Only add RENTER role if user has active contracts
            // Exclude terminated and cancelled contracts
            var activeContracts = await _db.Contracts
                .Where(c => c.RenterId == userId &&
                           (c.Status == "ACTIVE" || c.Status == "PENDING_PAYMENT") &&
                           c.Status != "TERMINATED" &&
                           c.Status != "CANCELLED_BY_USER" &&
                           c.Status != "CLOSED" &&
                           c.Status != "COMPLETED" &&
                           c.Status != "CANCELLED" &&
                           c.Status != "CANCELLED_BY_OWNER")
                .Include(c => c.Warehouse)
                .ToListAsync();

            var activeRenterWarehouseIds = activeContracts
                .Select(c => c.WarehouseId)
                .ToHashSet();


            foreach (var contract in activeContracts)
            {
                if (!warehouseItems.Any(w => w.warehouseId == contract.WarehouseId))
                {
                    warehouseItems.Add(new WarehouseContextItem
                    {
                        warehouseId = contract.WarehouseId,
                        warehouseName = contract.Warehouse?.Name ?? "",
                        role = "RENTER",
                        roles = new List<string> { "RENTER" },
                        skills = new List<string>(),
                        isAllSkill = false
                    });
                }
            }

            var context = new
            {
                userId = user.UserId,
                name = user.FullName,
                systemRole = user.Role?.RoleName?.ToLower() ?? "user",
                warehouses = warehouseItems
            };

            return Ok(context);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[GetWarehouseContext] ERROR: {ex.Message}\n{ex.StackTrace}");
            return StatusCode(500, new { message = "Internal error: " + ex.Message });
        }
    }

    /// <summary>Yêu cầu gửi email đặt lại mật khẩu</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        await _mediator.Send(new ForgotPasswordCommand(req.Email));
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

    /// <summary>Đăng nhập / đăng ký bằng Google OAuth</summary>
    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Email không hợp lệ từ Google." });

        // Tìm user theo email
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == req.Email);

        if (user == null)
        {
            // Tự tạo tài khoản mới (role USER mặc định)
            var userRole = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == "USER");
            if (userRole == null) return StatusCode(500, new { message = "Không tìm thấy role USER." });

            user = new WMS.Domain.Entities.User
            {
                Email = req.Email,
                FullName = req.FullName ?? req.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // random pass
                RoleId = userRole.RoleId,
                Status = "ACTIVE",
                AvatarUrl = req.AvatarUrl,
                CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else if (user.Status == "SUSPENDED" || user.Status == "DELETED")
        {
            return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa." });
        }
        else if (!string.IsNullOrEmpty(req.AvatarUrl) && user.AvatarUrl != req.AvatarUrl)
        {
            // Cập nhật avatar mới nhất từ Google
            user.AvatarUrl = req.AvatarUrl;
            await _db.SaveChangesAsync();
        }

        // Lấy IJwtService từ DI
        var jwtService = HttpContext.RequestServices
            .GetRequiredService<WMS.Application.Interfaces.IJwtService>();

        var roleName = user.Role?.RoleName ?? "USER";
        var token = jwtService.GenerateToken(user.UserId, user.Email, roleName);

        return Ok(new
        {
            userId = user.UserId,
            fullName = user.FullName,
            email = user.Email,
            role = roleName,
            token = token,
            avatarUrl = user.AvatarUrl
        });
    }
}

// ---- Request DTOs ----
public record RegisterRequest(string FullName, string Email, string Password, string? Phone, string RoleName);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
public record GoogleLoginRequest(string Email, string? FullName, string? GoogleId, string? AvatarUrl);
public record SendOtpRequest(string FullName, string Email, string Password, string? Phone, string? RoleName);
public record RegisterVerifyOtpRequest(string Email, string Otp);

// OTP payload stored in cache
public class OtpRegisterPayload
{
    public string Otp { get; set; } = "";
    public string FullName { get; set; } = "";
    public string? Phone { get; set; }
    public string Password { get; set; } = "";
    public string RoleName { get; set; } = "USER";
}

// ---- Response DTOs ----
public class WarehouseContextItem
{
    public int warehouseId { get; set; }
    public string warehouseName { get; set; } = "";
    public string role { get; set; } = "";          // Role cao nhất — dùng để hiển thị
    public List<string> roles { get; set; } = new(); // Tất cả roles — dùng để check quyền
    public List<string> skills { get; set; } = new();
    public bool isAllSkill { get; set; }
}
