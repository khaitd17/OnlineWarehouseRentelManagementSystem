using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Warehouses.CreateWarehouse;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly IMediator _mediator;

    public WarehousesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    //[Authorize(Roles = "OWNER")]
    public async Task<IActionResult> Create(CreateWarehouseCommand command)
    {
        // var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // if (userIdClaim == null)
        //     return Unauthorized();

        // var ownerId = int.Parse(userIdClaim);

        // var finalCommand = command with { OwnerId = ownerId };

        // var result = await _mediator.Send(finalCommand);

        var result = await _mediator.Send(command);
        return Ok(new { WarehouseId = result });
    }
}