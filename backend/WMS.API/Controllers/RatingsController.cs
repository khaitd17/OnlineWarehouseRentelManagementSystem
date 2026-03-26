using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Features.Ratings.CreateRating;
using WMS.Application.Features.Ratings.DeleteRating;
using WMS.Application.Features.Ratings.GetMyRatings;
using WMS.Application.Features.Ratings.GetWarehouseRatings;
using WMS.Application.Features.Ratings.ReplyToRating;
using WMS.Application.Features.Ratings.ToggleHideRating;
using WMS.Application.Features.Ratings.UpdateRating;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/ratings")]
[Authorize]
public class RatingsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;

    public RatingsController(IMediator mediator, ApplicationDbContext db)
    {
        _mediator = mediator;
        _db       = db;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    private bool IsAdmin() =>
        User.FindFirst(ClaimTypes.Role)?.Value == "Admin"
        || User.IsInRole("Admin");

    // ── GET /api/ratings/warehouse/{warehouseId} ─────────────────── Public
    [HttpGet("warehouse/{warehouseId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetWarehouseRatings(int warehouseId)
    {
        var result = await _mediator.Send(new GetWarehouseRatingsQuery { WarehouseId = warehouseId });
        return Ok(result);
    }

    // ── GET /api/ratings/owner/unreplied-count ──────────────── Owner badge
    [HttpGet("owner/unreplied-count")]
    public async Task<IActionResult> GetOwnerUnrepliedCount()
    {
        var userId = GetUserId();
        var count = await _db.Ratings
            .Include(r => r.Warehouse)
            .Where(r => r.Warehouse.OwnerId == userId && r.OwnerReply == null)
            .CountAsync();
        return Ok(new { count });
    }

    // ── GET /api/ratings/my-ratings ─────────────────────────────── Renter
    [HttpGet("my-ratings")]
    public async Task<IActionResult> GetMyRatings()
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new GetMyRatingsQuery { RenterId = userId });
        return Ok(result);
    }

    // ── GET /api/ratings/all ──────────────────────────────────────── Admin
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllRatings()
    {
        var result = await _mediator.Send(new GetAllRatingsQuery());
        return Ok(result);
    }

    // ── POST /api/ratings ────────────────────────────────────────── Renter
    [HttpPost]
    public async Task<IActionResult> CreateRating([FromBody] CreateRatingRequest body)
    {
        var userId = GetUserId();
        try
        {
            var ratingId = await _mediator.Send(new CreateRatingCommand
            {
                RenterId    = userId,
                WarehouseId = body.WarehouseId,
                ContractId  = body.ContractId,
                Star        = body.Star,
                Comment     = body.Comment,
            });
            return Ok(new { ratingId, message = "Đánh giá đã được gửi thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── PUT /api/ratings/{id} ─────────────────────────────────────── Renter
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRating(int id, [FromBody] UpdateRatingRequest body)
    {
        var userId = GetUserId();
        try
        {
            var ok = await _mediator.Send(new UpdateRatingCommand
            {
                RatingId  = id,
                CallerId  = userId,
                Star      = body.Star,
                Comment   = body.Comment,
            });
            return ok ? Ok(new { message = "Cập nhật đánh giá thành công." }) : NotFound();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    // ── DELETE /api/ratings/{id} ─────────────────────────────────── Renter/Admin
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRating(int id)
    {
        var userId = GetUserId();
        var admin  = IsAdmin();
        try
        {
            var ok = await _mediator.Send(new DeleteRatingCommand
            {
                RatingId = id,
                CallerId = userId,
                IsAdmin  = admin,
            });
            return ok ? Ok(new { message = "Đã xóa đánh giá." }) : NotFound();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    // ── POST /api/ratings/{id}/reply ─────────────────────────────── Owner
    [HttpPost("{id}/reply")]
    public async Task<IActionResult> ReplyToRating(int id, [FromBody] ReplyRequest body)
    {
        var userId = GetUserId();
        try
        {
            var ok = await _mediator.Send(new ReplyToRatingCommand
            {
                RatingId = id,
                OwnerId  = userId,
                Reply    = body.Reply,
            });
            return ok ? Ok(new { message = "Phản hồi đã được gửi." }) : NotFound();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    // ── DELETE /api/ratings/{id}/reply ───────────────────────────── Owner
    [HttpDelete("{id}/reply")]
    public async Task<IActionResult> DeleteReply(int id)
    {
        var userId = GetUserId();
        try
        {
            var ok = await _mediator.Send(new DeleteReplyCommand
            {
                RatingId = id,
                OwnerId  = userId,
            });
            return ok ? Ok(new { message = "Đã xóa phản hồi." }) : NotFound();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    // ── PATCH /api/ratings/{id}/toggle-hide ─────────────────── Owner/Admin
    [HttpPatch("{id}/toggle-hide")]
    public async Task<IActionResult> ToggleHide(int id)
    {
        var userId = GetUserId();
        var admin  = IsAdmin();
        var ok = await _mediator.Send(new ToggleHideRatingCommand
        {
            RatingId = id,
            CallerId = userId,
            IsAdmin  = admin,
        });
        return ok ? Ok(new { message = "Cập nhật trạng thái ẩn/hiện thành công." }) : NotFound();
    }
}

// ── Request DTOs ─────────────────────────────────────────────────────────────
public record CreateRatingRequest(int WarehouseId, int? ContractId, int Star, string? Comment);
public record UpdateRatingRequest(int Star, string? Comment);
public record ReplyRequest(string Reply);
