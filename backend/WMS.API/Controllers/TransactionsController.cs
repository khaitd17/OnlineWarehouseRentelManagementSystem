using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.Transactions.GetTransactions;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly IMediator _mediator;
    public TransactionsController(IMediator mediator) => _mediator = mediator;

    /// <summary>Lấy lịch sử giao dịch nhập/xuất kho với bộ lọc</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? warehouseId = null,
        [FromQuery] string? type = null,
        [FromQuery] string? itemName = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetTransactionsQuery
        {
            WarehouseId = warehouseId,
            Type        = type?.ToUpper(),
            ItemName    = itemName,
            From        = from,
            To          = to,
            Page        = page,
            PageSize    = pageSize,
        });
        return Ok(result);
    }
}
