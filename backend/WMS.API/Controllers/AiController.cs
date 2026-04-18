using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.AiAnalysis.AnalyzeItems;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers;

/// <summary>
/// Controller xử lý các tính năng AI phân tích đồ vật và gợi ý kho.
/// </summary>
[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAiAnalysisSessionRepository _sessionRepo;

    public AiController(IMediator mediator, IAiAnalysisSessionRepository sessionRepo)
    {
        _mediator = mediator;
        _sessionRepo = sessionRepo;
    }

    /// <summary>
    /// [POST] /api/ai/analyze-items
    /// Nhận ảnh đồ vật, gọi AI phân tích và gợi ý top 5 kho phù hợp.
    /// Giới hạn: 10 lần/ngày/user. Tối đa 5 ảnh, mỗi ảnh tối đa 10MB.
    /// </summary>
    [HttpPost("analyze-items")]
    [RequestSizeLimit(52_428_800)] // 50MB tổng
    public async Task<IActionResult> AnalyzeItems(
        [FromForm] List<IFormFile> images,
        [FromForm] string? province = null,
        [FromForm] string? district = null)
    {
        // Lấy userId từ JWT
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdStr))
            return Unauthorized(new { message = "Vui lòng đăng nhập để sử dụng tính năng này." });

        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Token không hợp lệ." });

        // Validate ảnh
        if (images == null || images.Count == 0)
            return BadRequest(new { message = "Vui lòng cung cấp ít nhất 1 ảnh." });

        if (images.Count > 5)
            return BadRequest(new { message = "Tối đa 5 ảnh mỗi lần phân tích." });

        // Kiểm tra kích thước từng ảnh (max 10MB)
        foreach (var img in images)
        {
            if (img.Length > 10 * 1024 * 1024)
                return BadRequest(new
                {
                    message = $"Ảnh '{img.FileName}' quá lớn (tối đa 10MB mỗi ảnh)."
                });

            var ext = Path.GetExtension(img.FileName).ToLowerInvariant();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp")
                return BadRequest(new
                {
                    message = $"Định dạng ảnh '{ext}' không được hỗ trợ. Vui lòng dùng JPG, PNG hoặc WEBP."
                });
        }

        try
        {
            var result = await _mediator.Send(new AnalyzeItemsCommand(
                UserId: userId,
                Images: images,
                PreferredProvince: province,
                PreferredDistrict: district
            ));

            return Ok(result);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("hết"))
        {
            return StatusCode(429, new { message = ex.Message });
        }
        catch (TimeoutException ex)
        {
            return StatusCode(504, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"[AiController] HttpRequestException: {ex.Message}");
            return StatusCode(502, new { message = $"Lỗi Gemini API: {ex.Message}" });
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"[AiController] InvalidOperationException: {ex.Message}");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AiController.AnalyzeItems] Unexpected error: {ex}");
            return StatusCode(500, new { message = $"Lỗi server: {ex.GetType().Name} - {ex.Message}" });
        }
    }

    /// <summary>
    /// [GET] /api/ai/my-sessions
    /// Lấy lịch sử các lần phân tích AI của user hiện tại (tối đa 20 bản ghi).
    /// </summary>
    [HttpGet("my-sessions")]
    public async Task<IActionResult> GetMySessions(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdStr))
            return Unauthorized();

        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var sessions = await _sessionRepo.GetByUserAsync(userId, cancellationToken);

        var result = sessions.Select(s => new
        {
            s.SessionId,
            s.AnalyzedAt,
            s.EstimatedVolumeM3,
            s.SuggestedType,
            s.SpecialNotes,
            s.Confidence
        });

        return Ok(result);
    }

    /// <summary>
    /// [GET] /api/ai/quota
    /// Kiểm tra còn bao nhiêu lượt AI hôm nay.
    /// </summary>
    [HttpGet("quota")]
    public async Task<IActionResult> GetQuota(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var usedToday = await _sessionRepo.CountTodayAsync(userId, cancellationToken);
        const int dailyLimit = 10;

        return Ok(new
        {
            usedToday,
            dailyLimit,
            remaining = Math.Max(0, dailyLimit - usedToday)
        });
    }
}
