using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Common;
using WMS.Application.Features.Audit.CreateAuditSession;
using WMS.Application.Features.Audit.ApproveAuditSession;
using WMS.Application.Features.Audit.ExportAuditReport;
using WMS.Application.Features.Audit.GetAuditResults;
using WMS.Application.Features.Audit.GetAuditSessionDetail;
using WMS.Application.Features.Audit.GetAuditSessions;
using WMS.Application.Features.Audit.RecordAuditResults;
using WMS.Application.Features.Audit.CloseAuditSession;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/audit-sessions")]
[Authorize]
public class AuditSessionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;

    public AuditSessionsController(IMediator mediator, ApplicationDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    /// <summary>Tạo phiên kiểm kê mới (OWNER hoặc RENTER)</summary>
    [HttpPost]
    [Authorize(Roles = "OWNER,RENTER")]
    public async Task<IActionResult> Create([FromBody] CreateAuditSessionRequest request)
    {
        if (request.WarehouseId <= 0)
        {
            return BadRequest(ApiResponse<int>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "WarehouseId phải là số nguyên dương." }));
        }

        int userId = GetCurrentUserId();
        string userRole = GetCurrentUserRole();
        var result = await _mediator.Send(new CreateAuditSessionCommand(
            request.WarehouseId, request.Notes, userId, userRole));

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    /// <summary>Duyệt phiên kiểm kê và gán nhân viên (chỉ OWNER)</summary>
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveAuditSessionRequest request)
    {
        if (request.AssignedTo <= 0)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "Vui lòng chọn nhân viên để giao kiểm kê." }));
        }

        int userId = GetCurrentUserId();
        var result = await _mediator.Send(new ApproveAuditSessionCommand(id, request.AssignedTo, request.Notes, userId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Từ chối phiên kiểm kê (chỉ OWNER)</summary>
    [HttpPut("{id}/reject")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectAuditSessionRequest? request)
    {
        int userId = GetCurrentUserId();
        var result = await _mediator.Send(new RejectAuditSessionCommand(id, request?.Reason, userId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Xem danh sách phiên kiểm kê (phân trang, lọc, tìm kiếm)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetAuditSessionsQuery query)
    {
        // Gán userId và role từ token
        query.UserId = GetCurrentUserId();
        query.UserRole = GetCurrentUserRole();
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>Xem chi tiết phiên kiểm kê</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await _mediator.Send(new GetAuditSessionDetailQuery(id));

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>Ghi nhận kết quả kiểm kê (OWNER hoặc STAFF được giao)</summary>
    [HttpPost("{id}/results")]
    [Authorize(Roles = "OWNER,STAFF")]
    public async Task<IActionResult> RecordResults(int id, [FromBody] RecordAuditResultsRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "Danh sách kết quả kiểm kê không được để trống." }));
        }

        var items = request.Items.Select(i => new AuditResultInput(
            i.ItemName, i.ExpectedQty, i.ActualQty, i.DiscrepancyReason
        )).ToList();

        int userId = GetCurrentUserId();
        var result = await _mediator.Send(new RecordAuditResultsCommand(id, items, request.CompleteSession, userId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Xem kết quả kiểm kê (phân trang, tìm kiếm, sắp xếp)</summary>
    [HttpGet("{id}/results")]
    public async Task<IActionResult> GetResults(int id, [FromQuery] GetAuditResultsQuery query)
    {
        query.AuditId = id;
        var result = await _mediator.Send(query);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>Xuất báo cáo kiểm kê (CSV)</summary>
    [HttpGet("{id}/export")]
    public async Task<IActionResult> ExportReport(int id)
    {
        var result = await _mediator.Send(new ExportAuditReportQuery(id));

        if (!result.Success)
            return NotFound(result);

        return File(result.Data!.FileContent, "text/csv; charset=utf-8", result.Data.FileName);
    }

    /// <summary>Đóng phiên kiểm kê (chỉ OWNER)</summary>
    [HttpPut("{id}/close")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CloseSession(int id, [FromBody] CloseAuditSessionRequest? request)
    {
        int userId = GetCurrentUserId();
        var result = await _mediator.Send(new CloseAuditSessionCommand(id, request?.Notes, userId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Lấy danh sách nhân viên của kho (dùng cho modal giao kiểm kê)</summary>
    [HttpGet("warehouse/{warehouseId}/staff")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetWarehouseStaff(int warehouseId)
    {
        var staff = await _db.WarehouseMemberships
            .Include(m => m.User)
            .Where(m => m.WarehouseId == warehouseId && m.IsActive)
            .Select(m => new
            {
                userId = m.UserId,
                fullName = m.User.FullName,
                email = m.User.Email,
                phone = m.User.Phone
            })
            .ToListAsync();

        return Ok(new { success = true, data = staff });
    }

    // ==============================
    // HELPERS
    // ==============================

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return int.Parse(sub ?? throw new UnauthorizedAccessException("Không xác định được người dùng."));
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role")
            ?? "";
    }
}

// ---- Request DTOs ----
public record CreateAuditSessionRequest(int WarehouseId, string? Notes);

public record ApproveAuditSessionRequest(int AssignedTo, string? Notes);

public record RejectAuditSessionRequest(string? Reason);

public record RecordAuditResultsRequest(
    List<RecordAuditResultItem> Items,
    bool CompleteSession = false
);

public record RecordAuditResultItem(
    string ItemName,
    int ExpectedQty,
    int ActualQty,
    string? DiscrepancyReason
);

public record CloseAuditSessionRequest(string? Notes);
