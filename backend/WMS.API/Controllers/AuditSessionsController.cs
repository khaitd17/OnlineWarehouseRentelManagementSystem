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

    /// <summary>Tạo phiên kiểm kê mới (OWNER hoặc RENTER trong kho đó)</summary>
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

        // Kiểm tra membership trong kho: chỉ OWNER hoặc RENTER
        var membership = await _db.WarehouseMemberships
            .Include(m => m.Role)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.WarehouseId == request.WarehouseId && m.IsActive);

        if (membership == null || (membership.Role.Code != "OWNER" && membership.Role.Code != "RENTER"))
            return StatusCode(403, ApiResponse<int>.ErrorResponse("Chỉ OWNER hoặc RENTER của kho mới có thể tạo phiên kiểm kê."));

        // Truyền warehouse role (không phải system role) cho handler
        string warehouseRole = membership.Role.Code;

        var result = await _mediator.Send(new CreateAuditSessionCommand(
            request.WarehouseId, request.Notes, userId, warehouseRole));

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    /// <summary>Duyệt phiên kiểm kê và gán nhân viên (chỉ OWNER của kho)</summary>
    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveAuditSessionRequest request)
    {
        if (request.AssignedTo <= 0)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "Vui lòng chọn nhân viên để giao kiểm kê." }));
        }

        int userId = GetCurrentUserId();

        var session = await _db.AuditSessions.FindAsync(id);
        if (session == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        if (!await IsOwnerOfWarehouseAsync(userId, session.WarehouseId))
            return StatusCode(403, ApiResponse<bool>.ErrorResponse("Chỉ OWNER của kho mới có thể duyệt phiên kiểm kê."));

        var result = await _mediator.Send(new ApproveAuditSessionCommand(id, request.AssignedTo, request.Notes, userId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Từ chối phiên kiểm kê (chỉ OWNER của kho)</summary>
    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectAuditSessionRequest? request)
    {
        int userId = GetCurrentUserId();

        var session = await _db.AuditSessions.FindAsync(id);
        if (session == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        if (!await IsOwnerOfWarehouseAsync(userId, session.WarehouseId))
            return StatusCode(403, ApiResponse<bool>.ErrorResponse("Chỉ OWNER của kho mới có thể từ chối phiên kiểm kê."));

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

    /// <summary>Ghi nhận kết quả kiểm kê.
    /// OWNER luôn được. STAFF/MANAGER/OPERATOR phải có skill INVENTORY_OPERATOR hoặc IsAllSkill.
    /// </summary>
    [HttpPost("{id}/results")]
    public async Task<IActionResult> RecordResults(int id, [FromBody] RecordAuditResultsRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "Danh sách kết quả kiểm kê không được để trống." }));
        }

        int userId = GetCurrentUserId();

        var session = await _db.AuditSessions.FindAsync(id);
        if (session == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        // OWNER luôn có quyền
        bool isOwner = await IsOwnerOfWarehouseAsync(userId, session.WarehouseId);
        if (!isOwner)
        {
            // STAFF/MANAGER/OPERATOR: cần skill INVENTORY_OPERATOR hoặc IsAllSkill
            var membership = await _db.WarehouseMemberships
                .Include(m => m.Role)
                .Include(m => m.Skills)
                .FirstOrDefaultAsync(m => m.UserId == userId && m.WarehouseId == session.WarehouseId && m.IsActive);

            if (membership == null)
                return StatusCode(403, ApiResponse<bool>.ErrorResponse("Bạn không có quyền trong kho này."));

            bool canRecord = membership.IsAllSkill ||
                membership.Skills.Any(s => s.Code == "INVENTORY_OPERATOR");

            if (!canRecord)
                return StatusCode(403, ApiResponse<bool>.ErrorResponse(
                    "Chỉ nhân viên có skill INVENTORY_OPERATOR (hoặc IsAllSkill) mới được ghi nhận kết quả kiểm kê."));
        }

        var items = request.Items.Select(i => new AuditResultInput(
            i.ItemName, i.ExpectedQty, i.ActualQty, i.DiscrepancyReason
        )).ToList();

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

    /// <summary>Đóng phiên kiểm kê (chỉ OWNER của kho)</summary>
    [HttpPut("{id}/close")]
    public async Task<IActionResult> CloseSession(int id, [FromBody] CloseAuditSessionRequest? request)
    {
        int userId = GetCurrentUserId();

        var session = await _db.AuditSessions.FindAsync(id);
        if (session == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        if (!await IsOwnerOfWarehouseAsync(userId, session.WarehouseId))
            return StatusCode(403, ApiResponse<bool>.ErrorResponse("Chỉ OWNER của kho mới có thể đóng phiên kiểm kê."));

        var result = await _mediator.Send(new CloseAuditSessionCommand(id, request?.Notes, userId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Lấy danh sách nhân viên có INVENTORY_OPERATOR skill trong kho (dùng để giao kiểm kê)</summary>
    [HttpGet("warehouse/{warehouseId}/staff")]
    public async Task<IActionResult> GetWarehouseStaff(int warehouseId)
    {
        int userId = GetCurrentUserId();

        // Chỉ OWNER hoặc OPERATOR của kho
        bool canAccess = await _db.WarehouseMemberships
            .AnyAsync(m => m.UserId == userId && m.WarehouseId == warehouseId && m.IsActive &&
                          (m.Role.Code == "OWNER" || m.Role.Code == "OPERATOR"));
        if (!canAccess)
            return StatusCode(403, new { success = false, message = "Chỉ OWNER hoặc OPERATOR mới xem được danh sách nhân viên." });

        // Lấy STAFF có skill INVENTORY_OPERATOR hoặc IsAllSkill
        var staff = await _db.WarehouseMemberships
            .Include(m => m.User)
            .Include(m => m.Role)
            .Include(m => m.Skills)
            .Where(m => m.WarehouseId == warehouseId && m.IsActive && m.Role.Code == "STAFF" &&
                       (m.IsAllSkill || m.Skills.Any(s => s.Code == "INVENTORY_OPERATOR")))
            .Select(m => new
            {
                userId   = m.UserId,
                fullName = m.User.FullName,
                email    = m.User.Email,
                phone    = m.User.Phone
            })
            .ToListAsync();

        return Ok(new { success = true, data = staff });
    }

    /// <summary>Lấy danh sách hàng hóa trong kho (dùng cho form ghi nhận kiểm kê)</summary>
    [HttpGet("warehouse/{warehouseId}/inventory")]
    public async Task<IActionResult> GetWarehouseInventory(int warehouseId)
    {
        var items = await _db.WarehouseInventories
            .Where(wi => wi.WarehouseId == warehouseId && wi.Quantity > 0)
            .Select(wi => new { wi.ItemName, wi.Quantity, wi.Unit })
            .OrderBy(wi => wi.ItemName)
            .ToListAsync();

        return Ok(new { success = true, data = items });
    }

    /// <summary>Lấy danh sách hàng hóa cần kiểm kê dựa theo thực thể tạo phiên (OWNER thấy hết, RENTER thấy của mình)</summary>
    [HttpGet("{id}/inventory-to-audit")]
    public async Task<IActionResult> GetAuditSessionInventory(int id)
    {
        var session = await _db.AuditSessions
            .Include(a => a.CreatedByNavigation)
                .ThenInclude(u => u.Role)
            .FirstOrDefaultAsync(a => a.AuditId == id);

        if (session == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        var warehouseId = session.WarehouseId;
        var creator = session.CreatedByNavigation;
        var roleName = creator.Role?.RoleName?.ToUpper() ?? "";

        var resultItems = new List<object>();

        if (roleName == "RENTER")
        {
            // Renter chỉ thấy hàng của mình
            var renterItems = await _db.RenterInventories
                .Include(ri => ri.Asset)
                .Where(ri => ri.WarehouseId == warehouseId && ri.Asset.RenterId == session.CreatedBy && ri.Quantity > 0)
                .Select(ri => new { itemName = ri.Asset.AssetName, quantity = ri.Quantity, unit = ri.Asset.Unit })
                .OrderBy(i => i.itemName)
                .ToListAsync();
            resultItems.AddRange(renterItems);
        }
        else // OWNER hoặc các role khác (mặc định thấy hết cho an toàn)
        {
            // 1. Lấy Warehouse Inventory (đồ dùng chung / đồ của chủ kho)
            var warehouseItems = await _db.WarehouseInventories
                .Where(wi => wi.WarehouseId == warehouseId && wi.Quantity > 0)
                .Select(wi => new { itemName = wi.ItemName, quantity = wi.Quantity, unit = wi.Unit })
                .ToListAsync();
            
            // 2. Lấy tất cả Renter Inventory trong kho này
            var renterItems = await _db.RenterInventories
                .Include(ri => ri.Asset)
                .Where(ri => ri.WarehouseId == warehouseId && ri.Quantity > 0)
                .Select(ri => new { itemName = ri.Asset.AssetName, quantity = ri.Quantity, unit = ri.Asset.Unit })
                .ToListAsync();

            resultItems.AddRange(warehouseItems);
            resultItems.AddRange(renterItems);
        }

        return Ok(new { 
            success = true, 
            data = resultItems.OrderBy(i => ((dynamic)i).itemName).ToList() 
        });
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

    // ── Permission helpers ──────────────────────────────────────────────────

    /// <summary>Kiểm tra user có OWNER membership trong kho không.</summary>
    private Task<bool> IsOwnerOfWarehouseAsync(int userId, int warehouseId) =>
        _db.WarehouseMemberships
            .AnyAsync(m => m.UserId == userId && m.WarehouseId == warehouseId
                           && m.IsActive && m.Role.Code == "OWNER");
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
