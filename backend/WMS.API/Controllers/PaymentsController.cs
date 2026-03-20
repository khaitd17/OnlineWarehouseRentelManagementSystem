using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.Payments.CreatePayment;
using WMS.Application.Features.Payments.GetPaymentQrInfo;
using WMS.Application.Features.Payments.GetPaymentStatus;
using WMS.Application.Features.Payments.GetPaymentsByContract;
using WMS.Application.Features.Payments.ProcessSepayWebhook;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IMediator mediator, ILogger<PaymentsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
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
