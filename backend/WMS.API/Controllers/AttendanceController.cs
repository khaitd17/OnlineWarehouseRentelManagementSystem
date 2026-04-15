using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Attendance.CheckIn;
using WMS.Application.Features.Attendance.CheckOut;
using WMS.Application.Features.Attendance.SetOvertime;
using WMS.Application.Features.Attendance.BulkSetOvertime;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _env;

    public AttendanceController(IMediator mediator, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _env      = env;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    // POST /api/attendance/check-in
    [HttpPost("check-in")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CheckIn([FromForm] int staffShiftId, IFormFile? photo)
    {
        try
        {
            var photoUrl = await SaveAttendancePhotoAsync(photo);
            var result   = await _mediator.Send(new CheckInCommand
            {
                CallerId     = GetUserId(),
                StaffShiftId = staffShiftId,
                PhotoUrl     = photoUrl,
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
    }

    // POST /api/attendance/check-out
    [HttpPost("check-out")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CheckOut([FromForm] int staffShiftId, IFormFile? photo)
    {
        try
        {
            var photoUrl = await SaveAttendancePhotoAsync(photo);
            var result   = await _mediator.Send(new CheckOutCommand
            {
                CallerId     = GetUserId(),
                StaffShiftId = staffShiftId,
                PhotoUrl     = photoUrl,
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
    }

    // PUT /api/attendance/{staffShiftId}/overtime
    [HttpPut("{staffShiftId:int}/overtime")]
    public async Task<IActionResult> SetOvertime(int staffShiftId, [FromBody] SetOvertimeBody body)
    {
        try
        {
            await _mediator.Send(new SetOvertimeCommand
            {
                CallerId     = GetUserId(),
                StaffShiftId = staffShiftId,
                Hours        = body.Hours,
            });
            return NoContent();
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
    }

    // POST /api/attendance/bulk-overtime
    [HttpPost("bulk-overtime")]
    public async Task<IActionResult> BulkSetOvertime([FromBody] BulkOvertimeBody body)
    {
        try
        {
            await _mediator.Send(new BulkSetOvertimeCommand
            {
                CallerId      = GetUserId(),
                WarehouseId   = body.WarehouseId,
                Date          = DateOnly.Parse(body.Date),
                MembershipIds = body.MembershipIds,
                Hours         = body.Hours,
            });
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
        catch (FormatException)               { return BadRequest(new { message = "Ngay khong hop le (yyyy-MM-dd)." }); }
    }

    // Luu anh diem danh vao thu muc uploads/attendance va tra ve URL
    private async Task<string> SaveAttendancePhotoAsync(IFormFile? file)
    {
        if (file == null || file.Length == 0) return "";

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            throw new InvalidOperationException("Chi chap nhan anh jpg, png, webp.");

        if (file.Length > 10 * 1024 * 1024)
            throw new InvalidOperationException("Anh khong duoc lon hon 10MB.");

        var folder   = Path.Combine(_env.ContentRootPath, "uploads", "attendance");
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var path     = Path.Combine(folder, fileName);
        using var stream = new FileStream(path, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/attendance/{fileName}";
    }
}

public record SetOvertimeBody  { public decimal Hours { get; init; } }
public record BulkOvertimeBody
{
    public int        WarehouseId   { get; init; }
    public string     Date          { get; init; } = "";
    public List<int>  MembershipIds { get; init; } = new();
    public decimal    Hours         { get; init; }
}
