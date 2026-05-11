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
using WMS.Domain.Interfaces;
using WMS.Domain.Exceptions;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/rental-requests")]
[Authorize]
public class RentalRequestsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IRentalRequestRepository _rentalRequestRepository;

    public RentalRequestsController(
        IMediator mediator,
        IWarehouseRepository warehouseRepository,
        IRentalRequestRepository rentalRequestRepository)
    {
        _mediator = mediator;
        _warehouseRepository = warehouseRepository;
        _rentalRequestRepository = rentalRequestRepository;
    }

    private int GetUserId()
    {
        // Try multiple claim types to be safe
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                          ?? User.FindFirst("sub")
                          ?? User.FindFirst("id")
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name);

        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            throw new UnauthorizedAccessException("User is not authenticated or user ID claim is missing");

        if (!int.TryParse(userIdClaim.Value, out int userId))
            throw new UnauthorizedAccessException($"Invalid User ID format in token: {userIdClaim.Value}");

        return userId;
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
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (DuplicateRequestException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (NotEnoughAreaException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidWarehouseStateException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
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
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
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
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
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
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
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
            if (id != command.RequestId)
                return BadRequest(new { message = "Request ID mismatch" });

            command.ReviewerId = GetUserId();

            var contractId = await _mediator.Send(command);

            return Ok(new
            {
                message = "Rental request approved successfully",
                contractId = contractId
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
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
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
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
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    /// <summary>
    /// Cancel a rental request (Renter only)
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelRentalRequest(int id, [FromBody] CancelRequestDto? dto)
    {
        try
        {
            var command = new CancelRentalRequestCommand
            {
                RequestId = id,
                RenterId = GetUserId(),
                CancellationReason = dto?.Reason // NEW - Accept reason from body
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
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }
    
    // DTO for cancel request
    public class CancelRequestDto
    {
        public string? Reason { get; set; }
    }

    /// <summary>
    /// Assign or update zone on a rental request (Owner only, post-approval)
    /// </summary>
    [HttpPost("{id}/assign-zone")]
    public async Task<IActionResult> AssignZone(int id, [FromBody] AssignZoneDto dto)
    {
        try
        {
            var ownerId = GetUserId();
            var rentalRequest = await _mediator.Send(
                new GetRentalRequestByIdQuery { RequestId = id });

            if (rentalRequest == null)
                return NotFound(new { message = "Rental request not found" });

            // Verify owner
            var warehouse = await _warehouseRepository.GetByIdAsync(
                rentalRequest.WarehouseId, HttpContext.RequestAborted);
            if (warehouse == null || warehouse.OwnerId != ownerId)
                return Forbid("Only warehouse owner can assign zones");

            // Update zone data on the rental request directly
            var entity = await _rentalRequestRepository.GetByIdAsync(id);
            if (entity == null)
                return NotFound(new { message = "Rental request not found" });

            entity.IsCustomArea = true;
            entity.ProposedPositionX = dto.PositionX;
            entity.ProposedPositionY = dto.PositionY;
            entity.ProposedWidth = dto.Width;
            entity.ProposedLength = dto.Length;
            entity.BaseRentalAreaId = dto.BaseAreaId;
            // Multi-zone support
            entity.AdditionalZonesJson = dto.AdditionalZonesJson;

            await _rentalRequestRepository.UpdateAsync(entity);

            return Ok(new
            {
                message = "Zone assigned successfully",
                isCustomArea = true,
                positionX = dto.PositionX,
                positionY = dto.PositionY,
                width = dto.Width,
                length = dto.Length,
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                message = "An error occurred", 
                error = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    public class AssignZoneDto
    {
        public double? PositionX { get; set; }
        public double? PositionY { get; set; }
        public double? Width { get; set; }
        public double? Length { get; set; }
        public int? BaseAreaId { get; set; }
        public string? AdditionalZonesJson { get; set; }
    }
}
