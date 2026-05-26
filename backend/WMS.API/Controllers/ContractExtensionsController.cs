using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Features.Payments.CreatePayment;
using WMS.Application.Features.ContractExtensions.RequestExtension;
using WMS.Application.Features.ContractExtensions.ReviewExtension;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

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
        private readonly ApplicationDbContext _db;

        public ContractExtensionsController(
            IMediator mediator,
            IContractExtensionRepository extensionRepo,
            IWarehouseRepository warehouseRepo,
            IRentalContractRepository contractRepo,
            ApplicationDbContext db)
        {
            _mediator = mediator;
            _extensionRepo = extensionRepo;
            _warehouseRepo = warehouseRepo;
            _contractRepo = contractRepo;
            _db = db;
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
        /// Get all extensions (completed, rejected, cancelled, pending-payment) for owner tracking
        /// </summary>
        [HttpGet("all-extensions")]
        public async Task<IActionResult> GetAllExtensionsForOwner()
        {
            try
            {
                var userId = GetUserId();
                var warehouses = await _warehouseRepo.GetByOwnerIdAsync(userId, CancellationToken.None);
                var warehouseIds = warehouses.Select(w => w.WarehouseId).ToList();

                var extensions = await _extensionRepo.GetCompletedByWarehouseIdsAsync(warehouseIds);
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
        /// Get approved extensions with new contracts pending owner signature
        /// </summary>
        [HttpGet("pending-signature")]
        public async Task<IActionResult> GetExtensionsPendingOwnerSignature()
        {
            try
            {
                var userId = GetUserId();

                // Get warehouses owned by current user
                var warehouses = await _warehouseRepo.GetByOwnerIdAsync(userId, CancellationToken.None);
                var warehouseIds = warehouses.Select(w => w.WarehouseId).ToList();

                // Get approved extensions where new contract is pending owner signature
                var extensions = await _extensionRepo.GetApprovedPendingSignatureByWarehouseIdsAsync(warehouseIds);

                var result = extensions.Select(e => new
                {
                    extensionId = e.ExtensionId,
                    originalContractId = e.OriginalContractId,
                    newContractId = e.NewContractId,
                    durationMonths = e.DurationMonths,
                    status = e.Status,
                    requestedAt = e.RequestedAt,
                    approvedAt = e.ReviewedAt,
                    requester = e.Requester != null ? new
                    {
                        userId = e.Requester.UserId,
                        fullName = e.Requester.FullName,
                        email = e.Requester.Email
                    } : null,
                    originalContract = e.OriginalContract != null ? new
                    {
                        contractId = e.OriginalContract.ContractId,
                        contractNumber = e.OriginalContract.ContractNumber,
                        warehouseId = e.OriginalContract.WarehouseId,
                        endDate = e.OriginalContract.EndDate,
                        monthlyPayment = e.OriginalContract.MonthlyPayment
                    } : null,
                    newContract = e.NewContract != null ? new
                    {
                        contractId = e.NewContract.ContractId,
                        contractNumber = e.NewContract.ContractNumber,
                        startDate = e.NewContract.StartDate,
                        endDate = e.NewContract.EndDate,
                        monthlyPayment = e.NewContract.MonthlyPayment,
                        status = e.NewContract.Status
                    } : null
                });

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
        /// Get current user's extensions
        /// </summary>
        [HttpGet("my-extensions")]
        public async Task<IActionResult> GetMyExtensions()
        {
            try
            {
                var userId = GetUserId();
                var extensions = await _extensionRepo.GetByRequesterIdAsync(userId);

                // Self-heal stale extension states: cash payment may have been confirmed
                // while extension status was not finalized due previous legacy query behavior.
                var latestPendingByContract = extensions
                    .Where(e => e.Status == ContractExtensionStatus.PendingPayment)
                    .GroupBy(e => e.OriginalContractId)
                    .Select(g => g.OrderByDescending(e => e.RequestedAt).First())
                    .ToList();

                foreach (var extension in latestPendingByContract)
                {
                    var anchorTime = extension.UpdatedAt ?? extension.RequestedAt;
                    var hasCompletedExtensionPayment = await _db.RentalPayments
                        .AsNoTracking()
                        .AnyAsync(p => p.ContractId == extension.OriginalContractId
                                       && p.PaymentType == PaymentType.Extension
                                       && p.Status == PaymentStatus.Completed
                                       && (p.PaidAt ?? p.UpdatedAt ?? p.CreatedAt) >= anchorTime);

                    if (!hasCompletedExtensionPayment)
                        continue;

                    var currentContract = await _contractRepo.GetByIdAsync(extension.OriginalContractId);
                    if (currentContract == null)
                        continue;

                    var approvedMonthly = extension.ProposedMonthlyPayment ?? currentContract.MonthlyPayment;
                    await _contractRepo.ApplyExtensionAsync(extension.OriginalContractId, extension.DurationMonths, approvedMonthly);
                    extension.MarkCompleted();
                    await _extensionRepo.UpdateAsync(extension);
                }
                 
                // Load original contracts separately due to FK mapping issue
                var contractIds = extensions.Select(e => e.OriginalContractId).Distinct().ToList();
                var contracts = await _db.Contracts
                    .Where(c => contractIds.Contains(c.ContractId))
                    .ToDictionaryAsync(c => c.ContractId);
                
                return Ok(extensions.Select(e => MapExtensionToDtoWithContract(e, contracts)));
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

                if (!extension.IsPending && !extension.IsPendingPayment)
                    return BadRequest(new { message = "Chỉ có thể hủy yêu cầu đang chờ duyệt hoặc chờ thanh toán" });

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

        /// <summary>
        /// Renter confirms or cancels an approved extension offer.
        /// If accepted, create extension payment and link user to payment flow.
        /// </summary>
        [HttpPost("{id}/renter-decision")]
        public async Task<IActionResult> SubmitRenterDecision(int id, [FromBody] RenterDecisionRequest request)
        {
            try
            {
                var userId = GetUserId();
                var extension = await _extensionRepo.GetByIdAsync(id);

                if (extension == null)
                    return NotFound(new { message = "Extension not found" });

                if (extension.RequesterId != userId)
                    return Forbid("Bạn chỉ có thể xử lý yêu cầu gia hạn của chính mình.");

                if (request.IsAccepted)
                {
                    if (extension.Status != ContractExtensionStatus.Approved && extension.Status != ContractExtensionStatus.PendingPayment)
                        return BadRequest(new { message = "Yêu cầu gia hạn chưa ở trạng thái có thể thanh toán." });

                    var approvedMonthly = extension.ProposedMonthlyPayment ?? 0;
                    if (approvedMonthly <= 0)
                        return BadRequest(new { message = "Chưa có giá gia hạn hợp lệ từ chủ kho." });

                    var amount = approvedMonthly * extension.DurationMonths;

                    if (extension.Status == ContractExtensionStatus.Approved)
                    {
                        extension.MarkPendingPayment();
                        await _extensionRepo.UpdateAsync(extension);
                    }

                    var payment = await _mediator.Send(new CreatePaymentCommand
                    {
                        ContractId = extension.OriginalContractId,
                        PaymentType = PaymentType.Extension,
                        AmountOverride = amount
                    });

                    return Ok(new
                    {
                        message = "Đã xác nhận gia hạn. Vui lòng thanh toán để hoàn tất.",
                        extensionId = extension.ExtensionId,
                        contractId = extension.OriginalContractId,
                        paymentId = payment.PaymentId,
                        amount = payment.Amount,
                        redirectUrl = $"/contracts/{extension.OriginalContractId}/payment?purpose=extension&extensionId={extension.ExtensionId}"
                    });
                }

                if (extension.Status != ContractExtensionStatus.Approved && extension.Status != ContractExtensionStatus.PendingPayment)
                    return BadRequest(new { message = "Yêu cầu gia hạn không ở trạng thái có thể hủy." });

                extension.Cancel();
                await _extensionRepo.UpdateAsync(extension);

                return Ok(new { message = "Đã hủy yêu cầu gia hạn." });
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

        private object MapExtensionToDtoWithContract(Domain.Entities.ContractExtension e, Dictionary<int, Contract> contracts)
        {
            Contract? contract = contracts.GetValueOrDefault(e.OriginalContractId);
            
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
                originalContract = contract != null ? new
                {
                    contractId = contract.ContractId,
                    contractNumber = contract.ContractNumber,
                    warehouseId = contract.WarehouseId,
                    startDate = contract.StartDate,
                    endDate = contract.EndDate,
                    monthlyPayment = contract.MonthlyPayment,
                    status = contract.Status
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

    public class RenterDecisionRequest
    {
        public bool IsAccepted { get; set; }
    }
}
