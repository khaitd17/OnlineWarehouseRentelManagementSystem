using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using WMS.Application.Common.Interfaces;
using WMS.Application.Features.Admin.Queries.GetWarehouseById;
using WMS.Application.Features.Admin.Commands.ApproveWarehouse;
using WMS.Application.Features.Admin.Commands.UpdateUserStatus;
using WMS.Application.Features.Admin.Queries.GetSystemReports;
using WMS.Application.Features.Admin.Queries.GetUsers;
using WMS.Application.Features.Admin.Queries.GetRoles;
using WMS.Application.Features.Admin.Queries.GetOwners;
using WMS.Application.Features.Admin.Queries.GetWarehousesByOwner;
using WMS.Application.Features.Admin.Commands.CreateUser;
using WMS.Application.Features.Admin.Commands.UpdateUser;
using WMS.Application.Features.Admin.Commands.DeleteUser;
using WMS.Application.Features.Admin.Commands.CreateWarehouse;
using WMS.Application.Features.Admin.Commands.UpdateWarehouse;
using WMS.Application.Features.Admin.Commands.DeleteWarehouse;

namespace WMS.API.Controllers;

[Authorize(Roles = "ADMIN")]
public class AdminController : BaseController
{
    private readonly IMediator _mediator;
    private readonly ICloudinaryService _cloudinaryService;

    public AdminController(IMediator mediator, ICloudinaryService cloudinaryService)
    {
        _mediator = mediator;
        _cloudinaryService = cloudinaryService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded");

        using var stream = file.OpenReadStream();
        var url = await _cloudinaryService.UploadImageAsync(stream, file.FileName, "warehouses");

        if (url == null) return StatusCode(500, "Upload failed");

        return Ok(new { url });
    }

    // --- User Management ---

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] GetUsersQuery query)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value;
        
        if (int.TryParse(currentUserId,out var userId))
        {
            query = query with { ExcludeUserId = userId };
        }

        var response = await _mediator.Send(query);
        return HandleResponse(response);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command)
    {
        var response = await _mediator.Send(command);
        return HandleResponse(response);
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserCommand command)
    {
        if (id != command.UserId) return BadRequest("ID mismatch");
        var response = await _mediator.Send(command);
        return HandleResponse(response);
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var response = await _mediator.Send(new DeleteUserCommand(id));
        return HandleResponse(response);
    }

    [HttpPut("users/status")]
    public async Task<IActionResult> UpdateUserStatus([FromBody] UpdateUserStatusCommand command)
    {
        var response = await _mediator.Send(command);
        return HandleResponse(response);
    }

    // --- Warehouse Management ---

    [HttpGet("warehouses")]
    public async Task<IActionResult> GetWarehouses([FromQuery] GetWarehousesByOwnerQuery query)
    {
        var response = await _mediator.Send(query);
        return HandleResponse(response);
    }

    [HttpGet("warehouses/{id}")]
    public async Task<IActionResult> GetWarehouseById(int id)
    {
        var response = await _mediator.Send(new GetWarehouseByIdQuery(id));
        return HandleResponse(response);
    }

    [HttpPost("warehouses")]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseCommand command)
    {
        var response = await _mediator.Send(command);
        return HandleResponse(response);
    }

    [HttpPut("warehouses/{id}")]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] UpdateWarehouseCommand command)
    {
        if (id != command.WarehouseId) return BadRequest("ID mismatch");
        var response = await _mediator.Send(command);
        return HandleResponse(response);
    }

    [HttpDelete("warehouses/{id}")]
    public async Task<IActionResult> DeleteWarehouse(int id)
    {
        var response = await _mediator.Send(new DeleteWarehouseCommand(id));
        return HandleResponse(response);
    }

    [HttpPut("warehouses/approve")]
    public async Task<IActionResult> ApproveWarehouse([FromBody] ApproveWarehouseCommand command)
    {
        var response = await _mediator.Send(command);
        return HandleResponse(response);
    }

    // --- Reports ---

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var response = await _mediator.Send(new GetSystemReportsQuery());
        return HandleResponse(response);
    }
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var response = await _mediator.Send(new GetRolesQuery());
        return HandleResponse(response);
    }

    [HttpGet("owners")]
    public async Task<IActionResult> GetOwners()
    {
        var response = await _mediator.Send(new GetOwnersQuery());
        return HandleResponse(response);
    }
}
