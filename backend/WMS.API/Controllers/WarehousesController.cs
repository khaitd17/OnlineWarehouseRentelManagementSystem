using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Warehouses.CreateWarehouse;
using WMS.Application.Features.Warehouses.GetOwnerWarehouses;
using WMS.Application.Features.Warehouses.GetWarehouseDetail;
using WMS.Application.Features.Warehouses.UpdateWarehouse;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarehouseController : ControllerBase
{
    private readonly IMediator _mediator;

    public WarehouseController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseCommand command)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        command.OwnerId = int.Parse(userId);

        var id = await _mediator.Send(command);

        return Ok(new
        {
            message = "Warehouse created successfully",
            warehouseId = id
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var result = await _mediator.Send(new GetWarehouseDetailQuery
        {
            WarehouseId = id
        });

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("owner/{ownerId}")]
    public async Task<IActionResult> GetOwnerWarehouses(int ownerId)
    {
        var result = await _mediator.Send(
            new GetOwnerWarehousesQuery(ownerId)
        );

        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWarehouse(int id, UpdateWarehouseCommand command)
    {
        if (id != command.WarehouseId)
            return BadRequest();

        await _mediator.Send(command);

        return Ok();
    }

    [HttpPost("{id}/media")]
    public async Task<IActionResult> UploadMedia(
        int id,
        [FromForm] AddWarehouseMediaCommand command)
    {
        command.WarehouseId = id;

        await _mediator.Send(command);

        return Ok();
    }
    [HttpPost("{id}/documents")]
    public async Task<IActionResult> UploadDocument(
        int id,
        [FromForm] AddWarehouseDocumentCommand command)
    {
        command.WarehouseId = id;

        await _mediator.Send(command);

        return Ok();
    }
    [HttpPatch("{id}/submit")]
    public async Task<IActionResult> SubmitWarehouse(int id)
    {
        await _mediator.Send(new SubmitWarehouseCommand
        {
            WarehouseId = id
        });

        return Ok(new
        {
            message = "Warehouse submitted for approval"
        });
    }

    [HttpGet("my-warehouses")]
    public async Task<IActionResult> GetMyWarehouses()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _mediator.Send(
            new GetOwnerWarehousesQuery(int.Parse(userId))
        );

        return Ok(result);
    }
}