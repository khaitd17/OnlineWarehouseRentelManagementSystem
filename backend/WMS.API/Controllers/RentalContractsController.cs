using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.RentalContracts.GetRentalContractById;
using WMS.Application.Features.RentalContracts.GetMyRentalContracts;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/rental-contracts")]
[Authorize]
public class RentalContractsController : ControllerBase
{
    private readonly IMediator _mediator;

    public RentalContractsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private int GetUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("User not found");
        
        return int.Parse(userId);
    }

    /// <summary>
    /// Get rental contract by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRentalContractById(int id)
    {
        try
        {
            var userId = GetUserId();
            var query = new GetRentalContractByIdQuery
            {
                ContractId = id,
                UserId = userId
            };

            var result = await _mediator.Send(query);
            if (result == null)
                return NotFound(new { message = "Rental contract not found" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get my rental contracts (as renter)
    /// </summary>
    [HttpGet("my-contracts")]
    public async Task<IActionResult> GetMyRentalContracts()
    {
        try
        {
            var userId = GetUserId();
            var query = new GetMyRentalContractsQuery { UserId = userId };
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get rental contracts by warehouse ID (for owner)
    /// </summary>
    [HttpGet("warehouse/{warehouseId}")]
    public async Task<IActionResult> GetContractsByWarehouse(int warehouseId)
    {
        try
        {
            var query = new GetMyRentalContractsQuery { WarehouseId = warehouseId };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }
}

