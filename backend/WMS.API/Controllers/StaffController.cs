using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Staff.CreateStaff;
using WMS.Application.Features.Staff.ListStaff;
using WMS.Application.Features.Staff.InactiveStaffAssignment;
using WMS.Application.Features.Staff.AssignStaffToWarehouse;

namespace WMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StaffController : ControllerBase
    {
        private readonly IMediator _mediator;

        public StaffController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateStaff(
            [FromBody] CreateStaffCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Extract user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var ownerId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Set OwnerId in command
                request.OwnerId = ownerId;

                var staffUserId = await _mediator.Send(request, cancellationToken);
                return Ok(new { message = "Staff created successfully", staffUserId });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = ex.Message });
            }
        }

        [HttpGet("list")]
        public async Task<IActionResult> ListStaff(
            [FromQuery] int? warehouseId,
            [FromQuery] string? searchKeyword,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Extract user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var ownerId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                var command = new ListStaffCommand(warehouseId, ownerId, pageNumber, pageSize, searchKeyword);
                var response = await _mediator.Send(command, cancellationToken);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = ex.Message });
            }
        }

        [HttpPost("inactive")]

        public async Task<IActionResult> InactiveStaffAssignment(
            [FromBody] InactiveStaffRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Extract user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var ownerId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                var command = new InactiveStaffAssignmentCommand(request.StaffId, ownerId, request.WarehouseId);
                var result = await _mediator.Send(command, cancellationToken);

                if (result)
                    return Ok(new { message = "Staff assignment(s) inactivated successfully" });
                else
                    return BadRequest(new { message = "Failed to inactive staff assignment(s)" });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = ex.Message });
            }
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignStaffToWarehouse(
            [FromBody] AssignStaffToWarehouseRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Extract user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var ownerId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                var command = new AssignStaffToWarehouseCommand(
                    request.StaffId,
                    request.WarehouseId,
                    ownerId,
                    request.StartDate,
                    request.EndDate,
                    request.Notes);

                var assignmentId = await _mediator.Send(command, cancellationToken);
                return Ok(new { message = "Staff assigned to warehouse successfully", assignmentId });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = ex.Message });
            }
        }
    }

    public class InactiveStaffRequest
    {
        public int StaffId { get; set; }
        public int? WarehouseId { get; set; }
    }

    public class AssignStaffToWarehouseRequest
    {
        public int StaffId { get; set; }
        public int WarehouseId { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string? Notes { get; set; }
    }
}
