using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.ReceiptNotes.ConfirmReceiptNote;
using WMS.Application.Features.ReceiptNotes.CreateReceiptNote;
using WMS.Application.Features.ReceiptNotes.GetReceiptNotes;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReceiptNotesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IStaffMembershipRepository _membershipRepo;
    private readonly IInventoryRequestRepository _requestRepo;

    public ReceiptNotesController(
        IMediator mediator,
        IStaffMembershipRepository membershipRepo,
        IInventoryRequestRepository requestRepo)
    {
        _mediator       = mediator;
        _membershipRepo = membershipRepo;
        _requestRepo    = requestRepo;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    /// <summary>
    /// Lấy tất cả phiếu nhập/xuất của 1 yêu cầu.
    /// </summary>
    [HttpGet("by-request/{invReqId:int}")]
    public async Task<IActionResult> GetByRequest(int invReqId)
    {
        var result = await _mediator.Send(new GetReceiptNotesByRequestQuery { InvReqId = invReqId });
        return Ok(result);
    }

    /// <summary>
    /// Staff tạo phiếu nhập kho khi hàng đến.
    /// Caller phải là STAFF / MANAGER / OPERATOR trong kho đó.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReceiptNoteBody body)
    {
        var staffId = GetUserId();

        // Load request để check kho
        var req = await _requestRepo.GetByIdAsync(body.InvReqId, HttpContext.RequestAborted);
        if (req == null) return NotFound(new { message = "Yêu cầu không tồn tại." });

        // Check quyền
        bool isOp    = await _membershipRepo.HasRoleAsync(staffId, req.WarehouseId, "OPERATOR", HttpContext.RequestAborted);
        bool isMgr   = await _membershipRepo.HasRoleAsync(staffId, req.WarehouseId, "MANAGER",  HttpContext.RequestAborted);
        bool isStaff = await _membershipRepo.HasRoleAsync(staffId, req.WarehouseId, "STAFF",    HttpContext.RequestAborted);

        if (!isOp && !isMgr && !isStaff)
            return StatusCode(403, new { message = "Chỉ thành viên vận hành kho mới được tạo phiếu nhập." });

        try
        {
            var result = await _mediator.Send(new CreateReceiptNoteCommand
            {
                InvReqId             = body.InvReqId,
                StaffId              = staffId,
                Notes                = body.Notes,
                StaffSignatureBase64 = body.StaffSignatureBase64,
                Items                = body.Items,
            });
            return CreatedAtAction(nameof(GetByRequest), new { invReqId = body.InvReqId }, result);
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
        catch (ArgumentException ex)          { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>
    /// Renter xác nhận phiếu nhập kho (ký xác nhận kết quả kiểm đếm).
    /// </summary>
    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmReceiptNoteBody? body = null)
    {
        var renterId = GetUserId();
        try
        {
            var result = await _mediator.Send(new ConfirmReceiptNoteCommand
            {
                ReceiptNoteId        = id,
                RenterId             = renterId,
                RenterSignatureBase64 = body?.RenterSignatureBase64,
            });
            return Ok(result);
        }
        catch (KeyNotFoundException ex)       { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex)  { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }
}

// ─── Request Bodies ──────────────────────────────────────────────────────────
public record CreateReceiptNoteBody
{
    public int InvReqId { get; init; }
    public string? Notes { get; init; }
    public string? StaffSignatureBase64 { get; init; }
    public List<CreateReceiptItemInput> Items { get; init; } = new();
}

public record ConfirmReceiptNoteBody
{
    public string? RenterSignatureBase64 { get; init; }
}
