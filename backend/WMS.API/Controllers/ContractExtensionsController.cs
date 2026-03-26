using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.ContractExtensions.RequestExtension;
using WMS.Application.Features.ContractExtensions.ReviewExtension;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/contract-extensions")]
    public class ContractExtensionsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IContractExtensionRepository _extensionRepo;
        private readonly IWarehouseRepository _warehouseRepo;
        private readonly IRentalContractRepository _contractRepo;

        public ContractExtensionsController(
            IMediator mediator,
            IContractExtensionRepository extensionRepo,
            IWarehouseRepository warehouseRepo,
            IRentalContractRepository contractRepo)
        {
            _mediator = mediator;
            _extensionRepo = extensionRepo;
            _warehouseRepo = warehouseRepo;
            _contractRepo = contractRepo;
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
        /// Request contract extension (for renter)
        /// </summary>
        [HttpPost("request")]
        public async Task<IActionResult> RequestExtension([FromBody] RequestExtensionRequest request)
        {
            try
            {
                var userId = GetUserId();
                var command = new RequestExtensionCommand
                {
                    OriginalContractId = request.ContractId > 0 ? request.ContractId : request.OriginalContractId,
                    RequesterId = userId,
                    DurationMonths = request.DurationMonths,
                    ProposedMonthlyPayment = request.ProposedMonthlyPayment,
                    Notes = request.Reason ?? request.Notes
                };

                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Get extension by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExtensionById(int id)
        {
            try
            {
                var extension = await _extensionRepo.GetByIdAsync(id);
                if (extension == null)
                    return NotFound(new { message = "Extension not found" });

                return Ok(MapExtensionToDto(extension));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Get extensions by contract ID
        /// </summary>
        [HttpGet("contract/{contractId}")]
        public async Task<IActionResult> GetExtensionsByContract(int contractId)
        {
            try
            {
                var extensions = await _extensionRepo.GetByOriginalContractIdAsync(contractId);
                return Ok(extensions.Select(MapExtensionToDto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Get pending extensions for owner
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingExtensions()
        {
            try
            {
                var userId = GetUserId();

                // Get warehouses owned by current user
                var warehouses = await _warehouseRepo.GetByOwnerIdAsync(userId, CancellationToken.None);
                var warehouseIds = warehouses.Select(w => w.WarehouseId).ToList();

                // Get pending extensions for those warehouses
                var extensions = await _extensionRepo.GetPendingByWarehouseIdsAsync(warehouseIds);
                return Ok(extensions.Select(MapExtensionToDto));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Get current user's extensions
        /// </summary>
        [HttpGet("my-extensions")]
        public async Task<IActionResult> GetMyExtensions()
        {
            try
            {
                var userId = GetUserId();
                var extensions = await _extensionRepo.GetByRequesterIdAsync(userId);
                return Ok(extensions.Select(MapExtensionToDto));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Review extension (legacy endpoint)
        /// </summary>
        [HttpPost("{id}/review")]
        public async Task<IActionResult> ReviewExtension(int id, [FromBody] ReviewExtensionRequest request)
        {
            try
            {
                var userId = GetUserId();
                var command = new ReviewExtensionCommand
                {
                    ExtensionId = id,
                    ReviewerId = userId,
                    Decision = request.Decision ?? request.Status ?? "APPROVE",
                    RejectionReason = request.RejectionReason ?? request.Reason,
                    ApprovedMonthlyPayment = request.ApprovedMonthlyPayment ?? request.NewMonthlyPayment
                };

                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Approve extension
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveExtension(int id, [FromBody] ApproveExtensionRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var command = new ReviewExtensionCommand
                {
                    ExtensionId = id,
                    ReviewerId = userId,
                    Decision = "APPROVE",
                    ApprovedMonthlyPayment = request?.NewMonthlyPayment
                };

                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(new { message = "Extension approved successfully", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Reject extension
        /// </summary>
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectExtension(int id, [FromBody] RejectExtensionRequest request)
        {
            try
            {
                var userId = GetUserId();
                var command = new ReviewExtensionCommand
                {
                    ExtensionId = id,
                    ReviewerId = userId,
                    Decision = "REJECT",
                    RejectionReason = request.Reason
                };

                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(new { message = "Extension rejected", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        /// <summary>
        /// Cancel extension request (by requester)
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelExtension(int id)
        {
            try
            {
                var userId = GetUserId();
                var extension = await _extensionRepo.GetByIdAsync(id);

                if (extension == null)
                    return NotFound(new { message = "Extension not found" });

                if (extension.RequesterId != userId)
                    return Forbid("You can only cancel your own extension requests");

                if (!extension.IsPending)
                    return BadRequest(new { message = "Can only cancel pending extension requests" });

                extension.Cancel();
                await _extensionRepo.UpdateAsync(extension);

                return Ok(new { message = "Extension cancelled successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        private static object MapExtensionToDto(Domain.Entities.ContractExtension e)
        {
            return new
            {
                extensionId = e.ExtensionId,
                originalContractId = e.OriginalContractId,
                newContractId = e.NewContractId,
                requesterId = e.RequesterId,
                durationMonths = e.DurationMonths,
                proposedMonthlyPayment = e.ProposedMonthlyPayment,
                status = e.Status,
                notes = e.Notes,
                rejectionReason = e.RejectionReason,
                requestedAt = e.RequestedAt,
                reviewedAt = e.ReviewedAt,
                reviewedBy = e.ReviewedBy,
                createdAt = e.CreatedAt,
                updatedAt = e.UpdatedAt,
                requester = e.Requester != null ? new
                {
                    userId = e.Requester.UserId,
                    fullName = e.Requester.FullName,
                    email = e.Requester.Email
                } : null,
                reviewer = e.Reviewer != null ? new
                {
                    userId = e.Reviewer.UserId,
                    fullName = e.Reviewer.FullName,
                    email = e.Reviewer.Email
                } : null,
                originalContract = e.OriginalContract != null ? new
                {
                    contractId = e.OriginalContract.ContractId,
                    contractNumber = e.OriginalContract.ContractNumber,
                    warehouseId = e.OriginalContract.WarehouseId,
                    startDate = e.OriginalContract.StartDate,
                    endDate = e.OriginalContract.EndDate,
                    monthlyPayment = e.OriginalContract.MonthlyPayment,
                    status = e.OriginalContract.Status
                } : null
            };
        }
    }

    // Request models
    public class RequestExtensionRequest
    {
        public int OriginalContractId { get; set; }
        public int ContractId { get; set; } // Alias for frontend compatibility
        public int DurationMonths { get; set; }
        public decimal? ProposedMonthlyPayment { get; set; }
        public string? Notes { get; set; }
        public string? Reason { get; set; } // Alias for frontend compatibility
    }

    public class ReviewExtensionRequest
    {
        public string? Decision { get; set; } // "APPROVE" or "REJECT"
        public string? Status { get; set; } // Alias: "APPROVED" or "REJECTED"
        public string? RejectionReason { get; set; }
        public string? Reason { get; set; } // Alias
        public decimal? ApprovedMonthlyPayment { get; set; }
        public decimal? NewMonthlyPayment { get; set; } // Alias
    }

    public class ApproveExtensionRequest
    {
        public decimal? NewMonthlyPayment { get; set; }
        public string? Notes { get; set; }
    }

    public class RejectExtensionRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}