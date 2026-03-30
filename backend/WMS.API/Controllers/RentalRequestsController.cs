using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.RentalRequests.CreateRentalRequest;
using WMS.Application.Features.RentalRequests.GetRentalRequestById;
using WMS.Application.Features.RentalRequests.GetMyRentalRequests;
using WMS.Application.Features.RentalRequests.GetPendingRequests;
using WMS.Application.Features.RentalRequests.GetOwnerRequests;
using WMS.Application.Features.RentalRequests.ApproveRentalRequest;
using WMS.Application.Features.RentalRequests.RejectRentalRequest;
using WMS.Application.Features.RentalRequests.CancelRentalRequest;
using WMS.Application.Features.RentalRequests.SendRentalRequest;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/rental-requests")]
[Authorize]
public class RentalRequestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public RentalRequestsController(IMediator mediator)
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
    /// Create a new rental request (Renter only)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateRentalRequest([FromBody] CreateRentalRequestCommand command)
    {
        try
        {
            command.RenterId = GetUserId();
            var requestId = await _mediator.Send(command);

            return Ok(new
            {
                message = "Rental request created successfully",
                requestId = requestId
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    /// <summary>
    /// Get rental request by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRentalRequestById(int id)
    {
        try
        {
            var userId = GetUserId();
            var query = new GetRentalRequestByIdQuery
            {
                RequestId = id,
                UserId = userId
            };

            var result = await _mediator.Send(query);
            if (result == null)
                return NotFound(new { message = "Rental request not found" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get my rental requests (Renter)
    /// </summary>
    [HttpGet("my-requests")]
    public async Task<IActionResult> GetMyRentalRequests()
    {
        try
        {
            var userId = GetUserId();
            var query = new GetMyRentalRequestsQuery { RenterId = userId };
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get pending rental requests for warehouses owned by current user (Owner)
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingRequests()
    {
        try
        {
            var userId = GetUserId();
            var query = new GetPendingRequestsQuery { OwnerId = userId };
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all rental requests for warehouses owned by current user with optional status filter (Owner)
    /// </summary>
    [HttpGet("owner/all")]
    public async Task<IActionResult> GetOwnerRequests([FromQuery] string? status = null)
    {
        try
        {
            var userId = GetUserId();
            var query = new GetOwnerRequestsQuery 
            { 
                OwnerId = userId,
                Status = status 
            };
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Approve a rental request (Owner only)
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveRentalRequest(int id, [FromBody] ApproveRentalRequestCommand command)
    {
        try
        {
            Console.WriteLine($"[CONTROLLER] ApproveRentalRequest called - ID: {id}");
            Console.WriteLine($"[CONTROLLER] Command: RequestId={command.RequestId}, MonthlyPayment={command.MonthlyPayment}, StartDate={command.StartDate}, DurationMonths={command.DurationMonths}");

            if (id != command.RequestId)
                return BadRequest(new { message = "Request ID mismatch" });

            command.ReviewerId = GetUserId();
            Console.WriteLine($"[CONTROLLER] ReviewerId set to: {command.ReviewerId}");

            var contractId = await _mediator.Send(command);
            Console.WriteLine($"[CONTROLLER] Contract created successfully - ContractId: {contractId}");

            return Ok(new
            {
                message = "Rental request approved successfully",
                contractId = contractId
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"[CONTROLLER ERROR] UnauthorizedAccessException: {ex.Message}");
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"[CONTROLLER ERROR] InvalidOperationException: {ex.Message}");
            Console.WriteLine($"[CONTROLLER ERROR] StackTrace: {ex.StackTrace}");
            return BadRequest(new { message = ex.Message, stackTrace = ex.StackTrace, type = ex.GetType().Name });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CONTROLLER ERROR] Exception: {ex.GetType().Name}");
            Console.WriteLine($"[CONTROLLER ERROR] Message: {ex.Message}");
            Console.WriteLine($"[CONTROLLER ERROR] StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[CONTROLLER ERROR] InnerException: {ex.InnerException.Message}");
            }
            return StatusCode(500, new {
                message = "An error occurred",
                error = ex.Message,
                stackTrace = ex.StackTrace,
                type = ex.GetType().Name,
                innerException = ex.InnerException?.Message
            });
        }
    }

    /// <summary>
    /// Reject a rental request (Owner only)
    /// </summary>
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectRentalRequest(int id, [FromBody] RejectRentalRequestCommand command)
    {
        try
        {
            if (id != command.RequestId)
                return BadRequest(new { message = "Request ID mismatch" });

            command.ReviewerId = GetUserId();
            await _mediator.Send(command);

            return Ok(new
            {
                message = "Rental request rejected successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Send a draft rental request (Renter only) - changes DRAFT to PENDING
    /// </summary>
    [HttpPost("{id}/send")]
    public async Task<IActionResult> SendRentalRequest(int id)
    {
        try
        {
            var command = new SendRentalRequestCommand
            {
                RequestId = id,
                RenterId = GetUserId()
            };

            await _mediator.Send(command);

            return Ok(new { message = "Rental request sent successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Cancel a rental request (Renter only)
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelRentalRequest(int id)
    {
        try
        {
            var command = new CancelRentalRequestCommand
            {
                RequestId = id,
                RenterId = GetUserId()
            };

            await _mediator.Send(command);

            return Ok(new { message = "Rental request cancelled successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }
}
