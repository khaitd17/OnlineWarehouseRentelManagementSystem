using MediatR;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.RentalRequests.ApproveRentalRequest;
using WMS.Application.Features.RentalRequests.CreateRentalRequest;
using WMS.Application.Features.RentalRequests.GetAllRentalRequests;
using WMS.Application.Features.RentalRequests.GetRentalRequestById;
using WMS.Application.Features.RentalRequests.GetRentalRequestsByRenter;
using WMS.Application.Features.RentalRequests.GetRentalRequestsByStatus;
using WMS.Application.Features.RentalRequests.RejectRentalRequest;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RentalRequestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public RentalRequestsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all rental requests
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetAllRentalRequestsQuery());
        return Ok(result);
    }

    /// <summary>
    /// Get rental request by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mediator.Send(new GetRentalRequestByIdQuery(id));
        
        if (result == null)
            return NotFound(new { Message = $"Rental request with ID {id} not found." });

        return Ok(result);
    }

    /// <summary>
    /// Get rental requests by renter ID
    /// </summary>
    [HttpGet("renter/{renterId}")]
    public async Task<IActionResult> GetByRenterId(int renterId)
    {
        var result = await _mediator.Send(new GetRentalRequestsByRenterQuery(renterId));
        return Ok(result);
    }

    /// <summary>
    /// Get rental requests by status (PENDING, APPROVED, REJECTED)
    /// </summary>
    [HttpGet("status/{status}")]
    public async Task<IActionResult> GetByStatus(string status)
    {
        var validStatuses = new[] { "PENDING", "APPROVED", "REJECTED" };
        if (!validStatuses.Contains(status.ToUpper()))
            return BadRequest(new { Message = "Invalid status. Valid values: PENDING, APPROVED, REJECTED" });

        var result = await _mediator.Send(new GetRentalRequestsByStatusQuery(status.ToUpper()));
        return Ok(result);
    }

    /// <summary>
    /// Create a new rental request
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(CreateRentalRequestCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = result }, new { RentalRequestId = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>
    /// Approve a rental request
    /// </summary>
    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveRequestDto dto)
    {
        try
        {
            var command = new ApproveRentalRequestCommand(id, dto.ReviewerId);
            var result = await _mediator.Send(command);

            if (!result)
                return NotFound(new { Message = $"Rental request with ID {id} not found." });

            return Ok(new { Message = "Rental request approved successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>
    /// Reject a rental request
    /// </summary>
    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectRequestDto dto)
    {
        try
        {
            var command = new RejectRentalRequestCommand(id, dto.ReviewerId, dto.RejectionReason);
            var result = await _mediator.Send(command);

            if (!result)
                return NotFound(new { Message = $"Rental request with ID {id} not found." });

            return Ok(new { Message = "Rental request rejected successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}

// DTOs for request bodies
public record ApproveRequestDto(int ReviewerId);
public record RejectRequestDto(int ReviewerId, string RejectionReason);
