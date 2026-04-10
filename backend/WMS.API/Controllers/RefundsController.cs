using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.Refunds.CompleteRefund;
using WMS.Application.Features.Refunds.GetRefunds;
using WMS.Application.Features.Refunds.ProcessRefund;
using System.Security.Claims;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/refunds")]
[Authorize]
public class RefundsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<RefundsController> _logger;

    public RefundsController(IMediator mediator, ILogger<RefundsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all refunds (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRefunds([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = new GetRefundsQuery
            {
                Status = status,
                Page = page,
                PageSize = pageSize
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting refunds");
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Process a refund for a cancelled contract
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> ProcessRefund([FromBody] ProcessRefundRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value ?? "0");

            var command = new ProcessRefundCommand
            {
                ContractId = request.ContractId,
                PaymentId = request.PaymentId,
                Reason = request.Reason,
                RequestedBy = userId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund");
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Complete/Reject a refund (Admin only)
    /// </summary>
    [HttpPost("{refundId}/complete")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CompleteRefund(int refundId, [FromBody] CompleteRefundRequest request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value ?? "0");

            var command = new CompleteRefundCommand
            {
                RefundId = refundId,
                IsApproved = request.IsApproved,
                RejectionReason = request.RejectionReason,
                ProcessedBy = userId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing refund {RefundId}", refundId);
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }
}

public class ProcessRefundRequest
{
    public int ContractId { get; set; }
    public int? PaymentId { get; set; }
    public string Reason { get; set; } = null!;
}

public class CompleteRefundRequest
{
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
}
