using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.InventoryRequests.GetRenterAssets;
using WMS.Application.Features.InventoryRequests.GetWarehouseAssets;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RenterAssetsController : ControllerBase
{
    private readonly IMediator _mediator;
    public RenterAssetsController(IMediator mediator) => _mediator = mediator;

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new UnauthorizedAccessException());

    private string GetUserRole() =>
        (User.FindFirst(ClaimTypes.Role)?.Value
         ?? User.FindFirst("role")?.Value
         ?? "").ToUpper();

    [HttpGet("my-inventory")]
    public async Task<IActionResult> GetMyInventory([FromQuery] int? warehouseId = null)
    {
        var renterId = GetUserId();
        var result = await _mediator.Send(new GetRenterAssetsQuery
        {
            RenterId    = renterId,
            WarehouseId = warehouseId,
        });
        return Ok(result);
    }

    [HttpGet("warehouse/{warehouseId:int}")]
    public async Task<IActionResult> GetWarehouseInventory(int warehouseId)
    {
        var role = GetUserRole();
        if (role is not ("OWNER" or "OPERATOR" or "MANAGER" or "STAFF"))
            return Forbid();

        var result = await _mediator.Send(new GetWarehouseAssetsQuery
        {
            WarehouseId = warehouseId,
        });
        return Ok(result);
    }
}
