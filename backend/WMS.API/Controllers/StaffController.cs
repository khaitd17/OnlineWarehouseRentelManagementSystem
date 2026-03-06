using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Staff.CreateStaff;

namespace WMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffController : ControllerBase
    {
        private readonly IMediator _mediator;

        public StaffController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("create")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
    }
}
