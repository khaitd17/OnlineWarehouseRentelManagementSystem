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
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/audit-sessions")]
[Authorize]
public class AuditSessionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _db;
    private readonly IStaffMembershipRepository _membershipRepo;

    public AuditSessionsController(
        IMediator mediator,
        ApplicationDbContext db,
        IStaffMembershipRepository membershipRepo)
    {
        _mediator       = mediator;
        _db             = db;
        _membershipRepo = membershipRepo;
    }

    /// <summary>Tạo phiên kiểm kê mới (chỉ RENTER có hợp đồng hiệu lực)</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditSessionRequest request)
    {
        if (request.WarehouseId <= 0)
            return BadRequest(ApiResponse<int>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "WarehouseId phải là số nguyên dương." }));

        int userId = GetCurrentUserId();

        var result = await _mediator.Send(new CreateAuditSessionCommand(
            request.WarehouseId, request.Notes, userId));

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

        var sessionInfo = await _db.AuditSessions.AsNoTracking()
            .Where(a => a.AuditId == id).Select(a => new { a.WarehouseId }).FirstOrDefaultAsync(HttpContext.RequestAborted);
        if (sessionInfo == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        if (!await IsOwnerOfWarehouseAsync(userId, sessionInfo.WarehouseId))
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

        var sessionInfo = await _db.AuditSessions.AsNoTracking()
            .Where(a => a.AuditId == id).Select(a => new { a.WarehouseId }).FirstOrDefaultAsync(HttpContext.RequestAborted);
        if (sessionInfo == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        if (!await IsOwnerOfWarehouseAsync(userId, sessionInfo.WarehouseId))
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
        int userId = GetCurrentUserId();
        query.UserId = userId;

        // Xác định UserRole để lọc danh sách theo quyền.
        if (query.WarehouseId.HasValue)
        {
            var isWarehouseOwner = await _db.Warehouses
                .AnyAsync(w => w.WarehouseId == query.WarehouseId.Value && w.OwnerId == userId, HttpContext.RequestAborted);
            
            if (isWarehouseOwner)
            {
                query.UserRole = "OWNER";
            }
            else
            {
                // Có filter kho cụ thể → lấy role trong kho đó
                var membership = await _membershipRepo.GetCallerMembershipAsync(
                    userId, query.WarehouseId.Value, HttpContext.RequestAborted);
                var role = membership?.RoleCode ?? "";
                
                if (role == "STAFF" || role == "RENTER")
                    query.UserRole = role;
                else
                    query.UserRole = "NONE";
            }
        }
        else
        {
            // Không filter kho → xác định effective role tổng hợp
            // để STAFF chỉ thấy phiên được giao cho họ, OWNER thấy phiên của kho mình.
            var isWarehouseOwner = await _db.Warehouses
                .AnyAsync(w => w.OwnerId == userId, HttpContext.RequestAborted);

            if (isWarehouseOwner)
            {
                query.UserRole = "OWNER";
            }
            else
            {
                var roleCodes = await _db.WarehouseMemberships
                    .Include(m => m.Role)
                    .Where(m => m.UserId == userId && m.IsActive)
                    .Select(m => m.Role.Code)
                    .Distinct()
                    .ToListAsync(HttpContext.RequestAborted);

                if (roleCodes.Any(r => r == "STAFF"))
                    query.UserRole = "STAFF";
                else if (roleCodes.Any(r => r == "RENTER"))
                    query.UserRole = "RENTER";
                else
                {
                    // Fallback: renter có thể không có WarehouseMembership,
                    // kiểm tra qua bảng contracts (hợp đồng chính)
                    var isRenter = await _db.Contracts
                        .AnyAsync(c => c.RenterId == userId && c.Status == "ACTIVE", HttpContext.RequestAborted);
                    query.UserRole = isRenter ? "RENTER" : "NONE";
                }
            }
        }

        if (query.UserRole == "NONE")
        {
            // Không có quyền hợp lệ, trả về danh sách rỗng để an toàn
            return Ok(ApiResponse<PagedResult<AuditSessionDto>>.SuccessResponse(
                new PagedResult<AuditSessionDto> { Items = new List<AuditSessionDto>(), TotalCount = 0, Page = 1, PageSize = 10 },
                "Không có quyền truy cập dữ liệu phiên kiểm kê."));
        }

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

    /// <summary>
    /// Ghi nhận kết quả kiểm kê.
    /// Chỉ nhân viên được giao kiểm kê (STAFF) mới ghi được.
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

        var sessionInfo = await _db.AuditSessions.AsNoTracking()
            .Where(a => a.AuditId == id).Select(a => new { a.AssignedTo }).FirstOrDefaultAsync(HttpContext.RequestAborted);
        if (sessionInfo == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        if (sessionInfo.AssignedTo != userId)
            return StatusCode(403, ApiResponse<bool>.ErrorResponse("Chỉ nhân viên (STAFF) được giao kiểm kê mới được ghi nhận kết quả."));

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

        var sessionInfo = await _db.AuditSessions
            .AsNoTracking()
            .Where(a => a.AuditId == id)
            .Select(a => new { a.AuditId, a.WarehouseId })
            .FirstOrDefaultAsync(HttpContext.RequestAborted);
        if (sessionInfo == null) return NotFound(ApiResponse<bool>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        if (!await IsOwnerOfWarehouseAsync(userId, sessionInfo.WarehouseId))
            return StatusCode(403, ApiResponse<bool>.ErrorResponse("Chỉ OWNER của kho mới có thể đóng phiên kiểm kê."));

        var result = await _mediator.Send(new CloseAuditSessionCommand(id, request?.Notes, userId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Lấy danh sách nhân viên trong kho (chỉ OWNER để giao kiểm kê)</summary>
    [HttpGet("warehouse/{warehouseId}/staff")]
    public async Task<IActionResult> GetWarehouseStaff(int warehouseId)
    {
        int userId = GetCurrentUserId();

        bool isOwner = await _db.Warehouses.AnyAsync(w => w.WarehouseId == warehouseId && w.OwnerId == userId, HttpContext.RequestAborted);
        if (!isOwner)
            return StatusCode(403, new { success = false, message = "Chỉ OWNER mới xem được danh sách nhân viên để giao kiểm kê." });

        // Chỉ lấy STAFF có skill INVENTORY_OPERATOR — đây là người đủ điều kiện được giao kiểm kê
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
        // Logic không đổi — không cần permission check riêng cho endpoint này
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
            .FirstOrDefaultAsync(a => a.AuditId == id);

        if (session == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Không tìm thấy phiên kiểm kê."));

        var warehouseId = session.WarehouseId;

        // Xác định role của người tạo phiên qua warehouse membership
        var creatorMembership = await _membershipRepo.GetCallerMembershipAsync(
            session.CreatedBy, warehouseId, HttpContext.RequestAborted);
        var roleName = creatorMembership?.RoleCode?.ToUpper() ?? "";

        // Fallback: nếu không có membership entry, kiểm tra xem họ có hợp đồng thuê kho không
        // (RENTER đôi khi chỉ tồn tại qua hợp đồng, không có WarehouseMembership)
        bool creatorIsRenter = roleName == "RENTER";
        if (!creatorIsRenter && creatorMembership == null)
        {
            creatorIsRenter = await _db.RentalContracts.AnyAsync(
                c => c.RenterId == session.CreatedBy && c.WarehouseId == warehouseId && c.Status == "ACTIVE",
                HttpContext.RequestAborted);
        }

        var resultItems = new List<object>();

        if (creatorIsRenter)
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

    // Chủ kho (OwnerId) mới được thực hiện
    // các thao tác quản trị phiên kiểm kê: duyệt, từ chối, đóng phiên.
    private async Task<bool> IsOwnerOfWarehouseAsync(int userId, int warehouseId)
    {
        return await _db.Warehouses
            .AnyAsync(w => w.WarehouseId == warehouseId && w.OwnerId == userId, HttpContext.RequestAborted);
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
