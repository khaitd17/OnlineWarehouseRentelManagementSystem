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
using WMS.Application.Features.Payments.RetryPayment;
using WMS.Application.Features.Payments.RequestPaymentReupload;
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
        if (string.IsNullOrWhiteSpace(command.PaymentMethod))
        {
            command.PaymentMethod = "CASH";
        }
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
    /// Chủ kho yêu cầu khách thuê tải lại chứng từ thanh toán
    /// </summary>
    [Authorize]
    [HttpPost("{paymentId}/request-reupload")]
    public async Task<IActionResult> RequestPaymentReupload(int paymentId, [FromBody] RequestPaymentReuploadRequest request)
    {
        var command = new RequestPaymentReuploadCommand
        {
            PaymentId = paymentId,
            OwnerId = GetCurrentUserId(),
            Reason = request.Reason
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
                        && (p.PaymentMethod == "CASH" || p.PaymentMethod == "BANK_TRANSFER")
                        && p.Contract != null
                        && warehouseIds.Contains(p.Contract.WarehouseId))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.PaymentId,
                p.PaymentCode,
                p.Amount,
                p.PaymentType,
                p.PaymentMethod,
                p.Status,
                p.CreatedAt,
                p.TransactionCode,
                p.ProofUrl,
                p.ProofNote,
                p.ProofSubmittedAt,
                p.ProofRequestedAt,
                p.ProofRequestReason,
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
    /// Lấy danh sách thanh toán tiền mặt của chủ kho (đã xác nhận + chưa xác nhận)
    /// </summary>
    [Authorize]
    [HttpGet("cash-confirmation-list")]
    public async Task<IActionResult> GetOwnerCashPayments()
    {
        var ownerId = GetCurrentUserId();

        var warehouseIds = await _db.Warehouses
            .Where(w => w.OwnerId == ownerId)
            .Select(w => w.WarehouseId)
            .ToListAsync();

        if (!warehouseIds.Any())
            return Ok(new List<object>());

        var statuses = new[] { "PENDING_CONFIRMATION", "COMPLETED", "REUPLOAD_REQUESTED", "CANCELLED" };

        var payments = await _db.RentalPayments
            .AsNoTracking()
            .Include(p => p.Contract)
            .Where(p => (p.PaymentMethod == "CASH" || p.PaymentMethod == "BANK_TRANSFER")
                        && p.Contract != null
                        && statuses.Contains(p.Status)
                        && warehouseIds.Contains(p.Contract.WarehouseId))
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Select(p => new
            {
                p.PaymentId,
                p.PaymentCode,
                p.Amount,
                p.PaymentType,
                p.Status,
                p.CreatedAt,
                p.UpdatedAt,
                p.PaidAt,
                p.PaymentMethod,
                p.TransactionCode,
                p.ProofUrl,
                p.ProofNote,
                p.ProofSubmittedAt,
                p.ProofRequestedAt,
                p.ProofRequestReason,
                Contract = new
                {
                    p.Contract!.ContractId,
                    p.Contract.ContractNumber,
                    p.Contract.RenterId,
                    RenterName = _db.Users.Where(u => u.UserId == p.Contract.RenterId).Select(u => u.FullName).FirstOrDefault(),
                    Warehouse = _db.Warehouses
                        .Where(w => w.WarehouseId == p.Contract.WarehouseId)
                        .Select(w => new { w.WarehouseId, w.Name })
                        .FirstOrDefault()
                }
            })
            .ToListAsync();

        return Ok(payments);
    }

    /// <summary>
    /// Lịch sử thanh toán của người dùng (bao gồm online + tiền mặt)
    /// </summary>
    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetPaymentHistory(
        [FromQuery] string? status,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0)
            return Unauthorized(new { message = "Không xác định được người dùng" });

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.RentalPayments
            .AsNoTracking()
            .Include(p => p.Contract)
                .ThenInclude(c => c.Warehouse)
            .Include(p => p.Contract)
                .ThenInclude(c => c.Renter)
            .Where(p => p.Contract != null &&
                       (p.Contract.RenterId == userId || p.Contract.Warehouse.OwnerId == userId));

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            query = query.Where(p => p.Status == normalizedStatus);
        }

        if (from.HasValue)
        {
            var fromUtc = DateTime.SpecifyKind(from.Value, DateTimeKind.Utc);
            query = query.Where(p => (p.PaidAt ?? p.CreatedAt) >= fromUtc);
        }

        if (to.HasValue)
        {
            var toUtc = DateTime.SpecifyKind(to.Value, DateTimeKind.Utc).AddDays(1).AddTicks(-1);
            query = query.Where(p => (p.PaidAt ?? p.CreatedAt) <= toUtc);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.PaidAt ?? p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                paymentId = p.PaymentId,
                contractId = p.ContractId,
                contractNumber = p.Contract != null ? p.Contract.ContractNumber : null,
                warehouseName = p.Contract != null && p.Contract.Warehouse != null ? p.Contract.Warehouse.Name : "",
                renterName = p.Contract != null && p.Contract.Renter != null ? p.Contract.Renter.FullName : "",
                amount = p.Amount,
                paymentType = p.PaymentType,
                termStart = p.TermStartDate,
                termEnd = p.TermEndDate,
                paymentDate = p.PaidAt ?? p.CreatedAt,
                dueDate = p.ExpiredAt,
                paymentMethod = p.PaymentMethod,
                transactionReference = p.SepayReferenceCode,
                status = p.Status
            })
            .ToListAsync();

        // Format kỳ thanh toán sau khi đã lấy dữ liệu (tránh lỗi EF translation)
        var result = items.Select(p => new
        {
            p.paymentId,
            p.contractId,
            p.contractNumber,
            p.warehouseName,
            p.renterName,
            p.amount,
            p.paymentType,
            paymentPeriod = p.termStart != null && p.termEnd != null
                ? $"Tháng {p.termStart.Value.Month}/{p.termStart.Value.Year} – Tháng {p.termEnd.Value.Month}/{p.termEnd.Value.Year}"
                : p.termStart != null
                    ? $"Tháng {p.termStart.Value.Month}/{p.termStart.Value.Year}"
                    : (string?)null,
            p.paymentDate,
            p.dueDate,
            p.paymentMethod,
            p.transactionReference,
            p.status
        }).ToList();

        return Ok(new
        {
            items = result,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
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

    /// <summary>
    /// Retry a failed/expired payment (max 3 retries)
    /// </summary>
    [HttpPost("{paymentId}/retry")]
    [Authorize]
    public async Task<IActionResult> RetryPayment(int paymentId)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value ?? "0");

            var command = new RetryPaymentCommand
            {
                PaymentId = paymentId,
                UserId = userId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    success = false,
                    message = result.Message,
                    retryCount = result.RetryCount,
                    maxRetry = result.MaxRetry
                });
            }

            return Ok(new
            {
                success = true,
                message = result.Message,
                paymentCode = result.PaymentCode,
                qrCodeUrl = result.QrCodeUrl,
                retryCount = result.RetryCount,
                maxRetry = result.MaxRetry,
                newExpiry = result.NewExpiry
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrying payment {PaymentId}", paymentId);
            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while retrying payment",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Get retry info for a payment
    /// </summary>
    [HttpGet("{paymentId}/retry-info")]
    [Authorize]
    public async Task<IActionResult> GetRetryInfo(int paymentId)
    {
        try
        {
            var payment = await _db.RentalPayments.FindAsync(paymentId);
            if (payment == null)
                return NotFound(new { message = "Payment not found" });

            return Ok(new
            {
                paymentId = payment.PaymentId,
                status = payment.Status,
                retryCount = payment.RetryCount,
                maxRetry = payment.MaxRetry,
                canRetry = payment.CanRetry,
                expiredAt = payment.ExpiredAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting retry info for payment {PaymentId}", paymentId);
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
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

public class RequestPaymentReuploadRequest
{
    public string? Reason { get; set; }
}
