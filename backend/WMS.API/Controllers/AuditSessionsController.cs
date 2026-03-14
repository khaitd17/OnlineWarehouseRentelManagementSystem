using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Common;
using WMS.Application.Features.Audit.CreateAuditSession;
using WMS.Application.Features.Audit.ExportAuditReport;
using WMS.Application.Features.Audit.GetAuditResults;
using WMS.Application.Features.Audit.GetAuditSessionDetail;
using WMS.Application.Features.Audit.GetAuditSessions;
using WMS.Application.Features.Audit.RecordAuditResults;
using WMS.Application.Features.Audit.CloseAuditSession;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/audit-sessions")]
[Authorize]
public class AuditSessionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuditSessionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Tạo phiên kiểm kê mới</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditSessionRequest request)
    {
        if (request.WarehouseId <= 0)
        {
            return BadRequest(ApiResponse<int>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "WarehouseId phải là số nguyên dương." }));
        }

        int userId = GetCurrentUserId();
        var result = await _mediator.Send(new CreateAuditSessionCommand(
            request.WarehouseId, request.Notes, userId));

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    /// <summary>Xem danh sách phiên kiểm kê (phân trang, lọc, tìm kiếm)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetAuditSessionsQuery query)
    {
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

    /// <summary>Ghi nhận kết quả kiểm kê</summary>
    [HttpPost("{id}/results")]
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

        var result = await _mediator.Send(new RecordAuditResultsCommand(id, items, request.CompleteSession));

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

    /// <summary>Đóng phiên kiểm kê</summary>
    [HttpPut("{id}/close")]
    public async Task<IActionResult> CloseSession(int id, [FromBody] CloseAuditSessionRequest? request)
    {
        var result = await _mediator.Send(new CloseAuditSessionCommand(id, request?.Notes));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
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
}

// ---- Request DTOs ----
public record CreateAuditSessionRequest(int WarehouseId, string? Notes);

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

