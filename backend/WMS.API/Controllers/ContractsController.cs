using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.Contracts.CancelContract;
using WMS.Application.Features.Contracts.TerminateEarly;
using WMS.Application.Features.Contracts.CompleteContract;
using WMS.Application.Features.Contracts.CloseContract;
using WMS.Application.Features.Contracts.ApproveTermination;
using WMS.Application.Features.Contracts.RejectTermination;
using WMS.Application.Features.Contracts.RequestClose;
using WMS.Application.Features.Contracts.GetContractHistory;
using WMS.Application.Features.Contracts.GetContracts;

namespace WMS.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class ContractsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ContractsController(IMediator mediator)
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

        [HttpGet]
        public async Task<ActionResult<GetContractsResponse>> GetContracts(
            [FromQuery] string? status = null,
            [FromQuery] DateTime? startDateFrom = null,
            [FromQuery] DateTime? startDateTo = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = new GetContractsQuery
            {
                UserId = GetUserId(),
                Status = status,
                StartDateFrom = startDateFrom,
                StartDateTo = startDateTo,
                PageNumber = pageNumber,
                PageSize = Math.Min(pageSize, 100) // Limit max page size
            };

            var result = await _mediator.Send(query);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<ActionResult<CancelContractResponse>> CancelContract(int id, [FromBody] CancelContractRequest request)
        {
            var command = new CancelContractCommand
            {
                ContractId = id,
                CancellationReason = request.CancellationReason,
                UserId = GetUserId()
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/terminate")]
        public async Task<ActionResult<TerminateEarlyResponse>> TerminateEarly(int id, [FromBody] TerminateEarlyRequest request)
        {
            var command = new TerminateEarlyCommand
            {
                ContractId = id,
                TerminationReason = request.TerminationReason,
                UserId = GetUserId()
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/complete")]
        public async Task<ActionResult<CompleteContractResponse>> CompleteContract(int id, [FromBody] CompleteContractRequest request)
        {
            var command = new CompleteContractCommand
            {
                ContractId = id,
                Notes = request.Notes,
                UserId = GetUserId()
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/close")]
        public async Task<ActionResult<CloseContractResponse>> CloseContract(int id, [FromBody] CloseContractRequest request)
        {
            var command = new CloseContractCommand
            {
                ContractId = id,
                DamageCompensation = request.DamageCompensation,
                Notes = request.Notes,
                UserId = GetUserId()
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpGet("{id}/history")]
        public async Task<ActionResult<GetContractHistoryResponse>> GetContractHistory(int id)
        {
            var query = new GetContractHistoryQuery
            {
                ContractId = id,
                UserId = GetUserId()
            };

            var result = await _mediator.Send(query);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/approve-termination")]
        public async Task<ActionResult<ApproveTerminationResponse>> ApproveTermination(int id, [FromBody] ApproveTerminationRequest request)
        {
            var command = new ApproveTerminationCommand
            {
                ContractId = id,
                UserId = GetUserId(),
                EarlyTerminationFee = request.EarlyTerminationFee
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/reject-termination")]
        public async Task<ActionResult<RejectTerminationResponse>> RejectTermination(int id, [FromBody] RejectTerminationRequest request)
        {
            var command = new RejectTerminationCommand
            {
                ContractId = id,
                UserId = GetUserId(),
                RejectReason = request.RejectReason
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/request-close")]
        public async Task<ActionResult<RequestCloseResponse>> RequestClose(int id)
        {
            var contract = await _mediator.Send(new RequestCloseCommand
            {
                ContractId = id,
                UserId = GetUserId()
            });

            return Ok(contract);
        }
    }

    // Request models
    public class CancelContractRequest
    {
        public string CancellationReason { get; set; } = string.Empty;
    }

    public class TerminateEarlyRequest
    {
        public string TerminationReason { get; set; } = string.Empty;
    }

    public class CompleteContractRequest
    {
        public string? Notes { get; set; }
    }

    public class CloseContractRequest
    {
        public decimal? DamageCompensation { get; set; }
        public string? Notes { get; set; }
    }

    public class ApproveTerminationRequest
    {
        public decimal? EarlyTerminationFee { get; set; } // Optional fee when owner approves
    }

    public class RejectTerminationRequest
    {
        public string? RejectReason { get; set; }
    }
}