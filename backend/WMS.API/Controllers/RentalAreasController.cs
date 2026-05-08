using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.RentalAreas.CreateRentalArea;
using WMS.Application.Features.RentalAreas.DeleteRentalArea;
using WMS.Application.Features.RentalAreas.GetByWarehouse;
using WMS.Application.Features.RentalAreas.UpdateRentalArea;

namespace WMS.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RentalAreasController : ControllerBase
{
    private readonly IMediator _mediator;

    public RentalAreasController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRentalArea([FromBody] CreateRentalAreaCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(new { RentalAreaId = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("warehouse/{warehouseId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByWarehouseId(int warehouseId)
    {
        var result = await _mediator.Send(new GetRentalAreasByWarehouseQuery { WarehouseId = warehouseId });
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRentalArea(int id, [FromBody] UpdateRentalAreaCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { Error = "ID mismatch" });
        }

        try
        {
            var result = await _mediator.Send(command);
            return Ok(new { Success = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRentalArea(int id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteRentalAreaCommand { Id = id });
            return Ok(new { Success = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}
