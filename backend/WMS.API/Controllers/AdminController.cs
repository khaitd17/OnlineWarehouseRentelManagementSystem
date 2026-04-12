using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Common;
using WMS.Application.Features.Admin.ApproveWarehouse;
using WMS.Application.Features.Admin.GetAccounts;
using WMS.Application.Features.Admin.GetOwnersLookup;
using WMS.Application.Features.Admin.GetRoles;
using WMS.Application.Features.Admin.GetSystemReports;
using WMS.Application.Features.Admin.GetWarehouseDetail;
using WMS.Application.Features.Admin.GetWarehousesByOwner;
using WMS.Application.Features.Admin.GetWarehousesLookup;
using WMS.Application.Features.Admin.GetPendingWarehouses;
using WMS.Application.Features.Admin.ManageListing;
using WMS.Application.Features.Admin.UpdateAccountStatus;
using WMS.Application.Features.Admin.GetSubscriptions;
using WMS.Application.Features.Admin.UpdateSubscription;
using WMS.Application.Features.Admin.DeleteSubscription;
using WMS.Application.Features.Admin.SubscriptionPackages;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ==============================
    // LOOKUP APIs
    // ==============================

    /// <summary>Lấy danh sách vai trò (cho bộ lọc tài khoản)</summary>
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var result = await _mediator.Send(new GetRolesQuery());
        return Ok(result);
    }

    /// <summary>Lấy danh sách chủ kho (cho bộ lọc kho theo chủ)</summary>
    [HttpGet("owners")]
    public async Task<IActionResult> GetOwners()
    {
        var result = await _mediator.Send(new GetOwnersLookupQuery());
        return Ok(result);
    }

    /// <summary>Lấy tất cả kho (có filter, sort, page) — không phân biệt chủ kho</summary>
    [HttpGet("warehouses")]
    public async Task<IActionResult> GetAllWarehouses([FromQuery] GetWarehousesByOwnerQuery query)
    {
        query.OwnerId = null; // all owners
        var result = await _mediator.Send(query);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Lookup kho đơn giản (dùng cho phiên kiểm kê)</summary>
    [HttpGet("warehouses/lookup")]
    public async Task<IActionResult> GetWarehousesLookup()
    {
        var result = await _mediator.Send(new GetWarehousesLookupQuery());
        return Ok(result);
    }

    // ==============================
    // ACCOUNT MANAGEMENT
    // ==============================

    /// <summary>Xem danh sách tất cả tài khoản (phân trang, lọc, tìm kiếm, sắp xếp)</summary>
    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts([FromQuery] GetAccountsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>Kích hoạt/Khóa tài khoản người dùng</summary>
    [HttpPut("accounts/{id}/status")]
    public async Task<IActionResult> UpdateAccountStatus(int id, [FromBody] UpdateAccountStatusRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "Trạng thái (Status) là bắt buộc." }));
        }

        var result = await _mediator.Send(new UpdateAccountStatusCommand(id, request.Status));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    // ==============================
    // WAREHOUSE MANAGEMENT
    // ==============================

    /// <summary>Lấy tất cả kho đang chờ duyệt (PENDING) — không phân biệt chủ kho</summary>
    [HttpGet("warehouses/pending")]
    public async Task<IActionResult> GetPendingWarehouses([FromQuery] GetPendingWarehousesQuery query)
    {
        var result = await _mediator.Send(query);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Xem danh sách kho theo chủ sở hữu</summary>
    [HttpGet("owners/{ownerId}/warehouses")]
    public async Task<IActionResult> GetWarehousesByOwner(int ownerId, [FromQuery] GetWarehousesByOwnerQuery query)
    {
        query.OwnerId = ownerId;
        var result = await _mediator.Send(query);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>Xem chi tiết kho</summary>
    [HttpGet("warehouses/{id}")]
    public async Task<IActionResult> GetWarehouseDetail(int id)
    {
        var result = await _mediator.Send(new GetWarehouseDetailQuery(id));

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>Quản lý hiển thị kho (ẩn/hiện/xóa)</summary>
    [HttpPut("warehouses/{id}/listing")]
    public async Task<IActionResult> ManageListing(int id, [FromBody] ManageListingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Action))
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(
                "Dữ liệu không hợp lệ.",
                new List<string> { "Hành động (Action) là bắt buộc. Chấp nhận: SHOW, HIDE, DELETE." }));
        }

        var result = await _mediator.Send(new ManageListingCommand(id, request.Action));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Duyệt/Từ chối kho</summary>
    [HttpPut("warehouses/{id}/approve")]
    public async Task<IActionResult> ApproveWarehouse(int id, [FromBody] ApproveWarehouseRequest request)
    {
        int adminId = GetCurrentUserId();

        var result = await _mediator.Send(new ApproveWarehouseCommand(
            id, request.IsApproved, request.RejectionReason, adminId));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    // ==============================
    // SUBSCRIPTION MANAGEMENT
    // ==============================

    /// <summary>Xem danh sách gói cước (phân trang, lọc, tìm kiếm, sắp xếp)</summary>
    [HttpGet("subscriptions")]
    public async Task<IActionResult> GetSubscriptions([FromQuery] GetSubscriptionsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>Cập nhật gói cước</summary>
    [HttpPut("subscriptions/{id}")]
    public async Task<IActionResult> UpdateSubscription(int id, [FromBody] UpdateSubscriptionRequest request)
    {
        var command = new UpdateSubscriptionCommand
        {
            SubscriptionId = id,
            Plan = request.Plan,
            Status = request.Status,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        var result = await _mediator.Send(command);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>Xóa gói cước</summary>
    [HttpDelete("subscriptions/{id}")]
    public async Task<IActionResult> DeleteSubscription(int id)
    {
        var result = await _mediator.Send(new DeleteSubscriptionCommand(id));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    // ==============================
    // SUBSCRIPTION PACKAGES MANAGEMENT
    // ==============================

    [HttpGet("subscription-packages")]
    public async Task<IActionResult> GetSubscriptionPackages()
    {
        var result = await _mediator.Send(new GetSubscriptionPackagesQuery());
        return Ok(result);
    }

    [HttpPost("subscription-packages")]
    public async Task<IActionResult> CreateSubscriptionPackage([FromBody] CreateSubscriptionPackageCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("subscription-packages/{id}")]
    public async Task<IActionResult> UpdateSubscriptionPackage(int id, [FromBody] UpdateSubscriptionPackageCommand command)
    {
        command.PackageId = id;
        var result = await _mediator.Send(command);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("subscription-packages/{id}")]
    public async Task<IActionResult> DeleteSubscriptionPackage(int id)
    {
        var result = await _mediator.Send(new DeleteSubscriptionPackageCommand(id));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ==============================
    // REPORTS
    // ==============================

    /// <summary>Xem báo cáo hệ thống</summary>
    [HttpGet("reports")]
    public async Task<IActionResult> GetSystemReports([FromQuery] GetSystemReportsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>Xuất báo cáo hệ thống (CSV)</summary>
    [HttpGet("reports/export")]
    public async Task<IActionResult> ExportSystemReports([FromQuery] ExportSystemReportsQuery query)
    {
        var result = await _mediator.Send(query);

        if (!result.Success)
            return BadRequest(result);

        return File(result.Data!, "text/csv; charset=utf-8", $"BaoCaoHeThong_{DateTime.UtcNow:yyyyMMdd}.csv");
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
public record UpdateAccountStatusRequest(string Status);
public record ManageListingRequest(string Action);
public record ApproveWarehouseRequest(bool IsApproved, string? RejectionReason);
public record UpdateSubscriptionRequest(string? Plan, string? Status, DateTime? StartDate, DateTime? EndDate);
