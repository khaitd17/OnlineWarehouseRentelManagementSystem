using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.ContractExtensions.RequestExtension;
using WMS.Application.Features.ContractExtensions.ReviewExtension;

namespace WMS.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class ContractExtensionsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ContractExtensionsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("request")]
        public async Task<ActionResult<RequestExtensionResponse>> RequestExtension([FromBody] RequestExtensionRequest request)
        {
            var command = new RequestExtensionCommand
            {
                OriginalContractId = request.OriginalContractId,
                RequesterId = int.Parse(HttpContext.Items["UserId"]?.ToString() ?? "0"),
                DurationMonths = request.DurationMonths,
                ProposedMonthlyPayment = request.ProposedMonthlyPayment,
                Notes = request.Notes
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/review")]
        public async Task<ActionResult<ReviewExtensionResponse>> ReviewExtension(int id, [FromBody] ReviewExtensionRequest request)
        {
            var command = new ReviewExtensionCommand
            {
                ExtensionId = id,
                ReviewerId = int.Parse(HttpContext.Items["UserId"]?.ToString() ?? "0"),
                Decision = request.Decision,
                RejectionReason = request.RejectionReason,
                ApprovedMonthlyPayment = request.ApprovedMonthlyPayment
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }

    // Request models
    public class RequestExtensionRequest
    {
        public int OriginalContractId { get; set; }
        public int DurationMonths { get; set; }
        public decimal? ProposedMonthlyPayment { get; set; }
        public string? Notes { get; set; }
    }

    public class ReviewExtensionRequest
    {
        public string Decision { get; set; } = string.Empty; // "APPROVE" or "REJECT"
        public string? RejectionReason { get; set; }
        public decimal? ApprovedMonthlyPayment { get; set; }
    }
}