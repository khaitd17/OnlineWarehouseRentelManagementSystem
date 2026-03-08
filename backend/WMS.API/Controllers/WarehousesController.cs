using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Warehouses.CreateWarehouse;
using WMS.Application.Features.Warehouses.ListWarehouses;

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

    [HttpGet("my-warehouses")]
    public async Task<IActionResult> GetMyWarehouses(CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "User ID not found in token" });
            }

            var command = new ListWarehousesCommand(ownerId);
            var response = await _mediator.Send(command, cancellationToken);
            return Ok(response.Data);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = ex.Message });
        }
    }
}