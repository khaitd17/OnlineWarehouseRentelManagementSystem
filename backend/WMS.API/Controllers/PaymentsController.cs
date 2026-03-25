using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Payments.GetPaymentHistory;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;
    public PaymentsController(IMediator mediator) => _mediator = mediator;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] string?   status   = null,
        [FromQuery] DateTime? from     = null,
        [FromQuery] DateTime? to       = null,
        [FromQuery] int       page     = 1,
        [FromQuery] int       pageSize = 20)
    {
        var result = await _mediator.Send(new GetPaymentHistoryQuery
        {
            UserId   = GetUserId(),
            Status   = status,
            From     = from,
            To       = to,
            Page     = page,
            PageSize = pageSize,
        });
        return Ok(result);
    }
}
