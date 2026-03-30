using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Payments.ConfirmCashPayment;
using WMS.Application.Features.Payments.CreatePayment;
using WMS.Application.Features.Payments.GetPaymentQrInfo;
using WMS.Application.Features.Payments.GetPaymentStatus;
using WMS.Application.Features.Payments.GetPaymentsByContract;
using WMS.Application.Features.Payments.ProcessSepayWebhook;
using WMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PaymentsController> _logger;
    private readonly ApplicationDbContext _db;

    public PaymentsController(IMediator mediator, ILogger<PaymentsController> logger, ApplicationDbContext db)
    {
        _mediator = mediator;
        _logger = logger;
        _db = db;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;
        return int.TryParse(userIdClaim, out var id) ? id : 0;
    }

    /// <summary>
    /// Tạo payment mới cho contract
    /// </summary>
    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin QR để thanh toán
    /// </summary>
    [Authorize]
    [HttpGet("{paymentId}/qr-info")]
    public async Task<IActionResult> GetPaymentQrInfo(int paymentId)
    {
        var result = await _mediator.Send(new GetPaymentQrInfoQuery { PaymentId = paymentId });
        return Ok(result);
    }

    /// <summary>
    /// Kiểm tra trạng thái payment
    /// </summary>
    [Authorize]
    [HttpGet("{paymentId}/status")]
    public async Task<IActionResult> GetPaymentStatus(int paymentId)
    {
        var result = await _mediator.Send(new GetPaymentStatusQuery { PaymentId = paymentId });
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách payments của contract
    /// </summary>
    [Authorize]
    [HttpGet("contract/{contractId}")]
    public async Task<IActionResult> GetPaymentsByContract(int contractId)
    {
        var result = await _mediator.Send(new GetPaymentsByContractQuery { ContractId = contractId });
        return Ok(result);
    }

    /// <summary>
    /// Tạo cash payment (thanh toán tiền mặt) - cần xác nhận từ owner
    /// </summary>
    [Authorize]
    [HttpPost("cash")]
    public async Task<IActionResult> CreateCashPayment([FromBody] CreatePaymentCommand command)
    {
        command.PaymentMethod = "CASH";
        command.Status = "PENDING_CONFIRMATION"; // Chờ owner xác nhận
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Chủ kho xác nhận thanh toán tiền mặt
    /// </summary>
    [Authorize]
    [HttpPost("{paymentId}/confirm")]
    public async Task<IActionResult> ConfirmCashPayment(int paymentId, [FromBody] ConfirmCashPaymentRequest request)
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = paymentId,
            OwnerId = GetCurrentUserId(),
            IsApproved = request.IsApproved,
            RejectionReason = request.RejectionReason
        };

        var result = await _mediator.Send(command);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách thanh toán tiền mặt chờ xác nhận (cho chủ kho)
    /// </summary>
    [Authorize]
    [HttpGet("pending-confirmation")]
    public async Task<IActionResult> GetPendingCashPayments()
    {
        var ownerId = GetCurrentUserId();
        _logger.LogInformation("GetPendingCashPayments for ownerId: {OwnerId}", ownerId);

        // Get warehouses owned by current user
        var warehouseIds = await _db.Warehouses
            .Where(w => w.OwnerId == ownerId)
            .Select(w => w.WarehouseId)
            .ToListAsync();

        _logger.LogInformation("Found {Count} warehouses for owner {OwnerId}: [{Ids}]", 
            warehouseIds.Count, ownerId, string.Join(", ", warehouseIds));

        if (!warehouseIds.Any())
            return Ok(new List<object>());

        // Get pending cash payments for contracts in owner's warehouses
        var pendingPayments = await _db.RentalPayments
            .Include(p => p.Contract)
            .Where(p => p.Status == "PENDING_CONFIRMATION"
                        && p.PaymentMethod == "CASH"
                        && p.Contract != null
                        && warehouseIds.Contains(p.Contract.WarehouseId))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.PaymentId,
                p.PaymentCode,
                p.Amount,
                p.PaymentType,
                p.Status,
                p.CreatedAt,
                Contract = new
                {
                    p.Contract!.ContractId,
                    p.Contract.ContractNumber,
                    p.Contract.RenterId,
                    RenterName = _db.Users.Where(u => u.UserId == p.Contract.RenterId).Select(u => u.FullName).FirstOrDefault(),
                    Warehouse = _db.Warehouses.Where(w => w.WarehouseId == p.Contract.WarehouseId).Select(w => new { w.WarehouseId, w.Name }).FirstOrDefault()
                }
            })
            .ToListAsync();

        _logger.LogInformation("Found {Count} pending cash payments", pendingPayments.Count);
        return Ok(pendingPayments);
    }

    /// <summary>
    /// Webhook callback từ SePay khi có giao dịch
    /// </summary>
    [AllowAnonymous]
    [HttpPost("sepay-webhook")]
    public async Task<IActionResult> SepayWebhook([FromBody] SepayWebhookRequest request)
    {
        // Get IP address
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            ipAddress = forwardedFor.Split(',').First().Trim();
        }

        _logger.LogInformation("SePay webhook received from IP: {IpAddress}, TransactionId: {TransactionId}",
            ipAddress, request.Id);

        var command = new ProcessSepayWebhookCommand
        {
            Id = request.Id,
            Gateway = request.Gateway,
            TransactionDate = request.TransactionDate,
            AccountNumber = request.AccountNumber,
            Code = request.Code,
            Content = request.Content,
            TransferType = request.TransferType,
            TransferAmount = request.TransferAmount,
            Accumulated = request.Accumulated,
            SubAccount = request.SubAccount,
            ReferenceCode = request.ReferenceCode,
            Description = request.Description,
            IpAddress = ipAddress
        };

        var result = await _mediator.Send(command);

        // SePay expects {"success": true} with HTTP 200
        return Ok(new { success = result.Success });
    }
}

public class SepayWebhookRequest
{
    public int Id { get; set; }
    public string? Gateway { get; set; }
    public string? TransactionDate { get; set; }
    public string? AccountNumber { get; set; }
    public string? Code { get; set; }
    public string? Content { get; set; }
    public string? TransferType { get; set; }
    public decimal TransferAmount { get; set; }
    public decimal? Accumulated { get; set; }
    public string? SubAccount { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Description { get; set; }
}

public class ConfirmCashPaymentRequest
{
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
}
