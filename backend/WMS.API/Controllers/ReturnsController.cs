using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/warehouse-returns")]
public class ReturnsController : ControllerBase
{
    private readonly IWarehouseReturnRepository _returnRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;

    public ReturnsController(
        IWarehouseReturnRepository returnRepo,
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo)
    {
        _returnRepo = returnRepo;
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
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
    /// Initiate warehouse return process
    /// </summary>
    [HttpPost("initiate")]
    public async Task<IActionResult> InitiateReturn([FromBody] InitiateReturnRequest request)
    {
        try
        {
            var userId = GetUserId();
            var contract = await _contractRepo.GetByIdAsync(request.ContractId);

            if (contract == null)
                return NotFound(new { message = "Contract not found" });

            if (contract.RenterId != userId)
                return Forbid("You are not authorized to initiate return for this contract");

            if (contract.Status != RentalContractStatus.Active && contract.Status != RentalContractStatus.Completed)
                return BadRequest(new { message = "Contract must be Active or Completed to initiate return" });

            // Check existing return
            var existingReturn = await _returnRepo.GetByContractIdAsync(request.ContractId);
            if (existingReturn != null)
            {
                return Ok(new
                {
                    returnId = existingReturn.ReturnId,
                    contractId = existingReturn.ContractId,
                    status = existingReturn.Status,
                    createdAt = existingReturn.CreatedAt,
                    message = "Return already initiated"
                });
            }

            // Create new return
            var warehouseReturn = WarehouseReturn.Create(request.ContractId);
            var returnId = await _returnRepo.AddAsync(warehouseReturn);

            return Ok(new
            {
                returnId = returnId,
                contractId = request.ContractId,
                status = warehouseReturn.Status,
                createdAt = warehouseReturn.CreatedAt
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get return by contract ID
    /// </summary>
    [HttpGet("contract/{contractId}")]
    public async Task<IActionResult> GetReturnByContract(int contractId)
    {
        try
        {
            var returnRecord = await _returnRepo.GetByContractIdAsync(contractId);
            if (returnRecord == null)
                return NotFound(new { message = "No return found for this contract" });

            return Ok(MapToDto(returnRecord));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get return by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetReturnById(int id)
    {
        try
        {
            var returnRecord = await _returnRepo.GetByIdAsync(id);
            if (returnRecord == null)
                return NotFound(new { message = "Return not found" });

            return Ok(MapToDto(returnRecord));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Submit inspection data
    /// </summary>
    [HttpPost("{id}/inspect")]
    public async Task<IActionResult> SubmitInspection(int id, [FromBody] InspectRequest request)
    {
        try
        {
            var userId = GetUserId();
            var returnRecord = await _returnRepo.GetByIdAsync(id);

            if (returnRecord == null)
                return NotFound(new { message = "Return not found" });

            returnRecord.RecordInspection(
                inspectorId: userId,
                isClean: request.IsClean,
                isEquipmentIntact: request.IsEquipmentIntact,
                isNoOutstandingDebt: request.IsNoOutstandingDebt,
                notes: request.Notes,
                damageFee: request.DamageFee,
                penaltyFee: request.PenaltyFee
            );

            await _returnRepo.UpdateAsync(returnRecord);

            return Ok(new
            {
                message = "Inspection submitted successfully",
                returnId = returnRecord.ReturnId,
                status = returnRecord.Status
            });
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
    /// Get pending returns for owner
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingReturns()
    {
        try
        {
            var userId = GetUserId();

            // Get warehouses owned by this user
            var warehouses = await _warehouseRepo.GetByOwnerIdAsync(userId, CancellationToken.None);
            var warehouseIds = warehouses.Select(w => w.WarehouseId).ToList();

            if (!warehouseIds.Any())
                return Ok(new List<object>());

            // Get pending returns for these warehouses
            var pendingReturns = await _returnRepo.GetPendingByWarehouseIdsAsync(warehouseIds);

            var result = new List<object>();
            foreach (var ret in pendingReturns)
            {
                var contract = await _contractRepo.GetByIdAsync(ret.ContractId);
                var warehouse = contract != null ? warehouses.FirstOrDefault(w => w.WarehouseId == contract.WarehouseId) : null;

                result.Add(new
                {
                    returnId = ret.ReturnId,
                    contractId = ret.ContractId,
                    contractNumber = contract?.ContractNumber,
                    renterName = contract?.Renter?.FullName,
                    warehouseName = warehouse?.Name,
                    warehouseAddress = warehouse?.Address,
                    status = ret.Status,
                    isClean = ret.IsClean,
                    isEquipmentIntact = ret.IsEquipmentIntact,
                    isNoOutstandingDebt = ret.IsNoOutstandingDebt,
                    notes = ret.Notes,
                    damageFee = ret.DamageFee,
                    penaltyFee = ret.PenaltyFee,
                    createdAt = ret.CreatedAt,
                    inspectionDate = ret.InspectionDate
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Approve return
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveReturn(int id, [FromBody] ApproveReturnRequest? request = null)
    {
        try
        {
            var userId = GetUserId();
            var returnRecord = await _returnRepo.GetByIdAsync(id);

            if (returnRecord == null)
                return NotFound(new { message = "Return not found" });

            // Verify owner
            var contract = await _contractRepo.GetByIdAsync(returnRecord.ContractId);
            if (contract == null)
                return NotFound(new { message = "Contract not found" });

            var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, CancellationToken.None);
            if (warehouse == null || warehouse.OwnerId != userId)
                return Forbid("You are not authorized to approve this return");

            returnRecord.Approve();
            await _returnRepo.UpdateAsync(returnRecord);

            // Update contract status to CLOSED
            contract.Close();
            await _contractRepo.UpdateAsync(contract);

            return Ok(new
            {
                message = "Return approved successfully",
                returnId = returnRecord.ReturnId,
                status = returnRecord.Status
            });
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
    /// Reject return
    /// </summary>
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectReturn(int id, [FromBody] RejectReturnRequest request)
    {
        try
        {
            var userId = GetUserId();
            var returnRecord = await _returnRepo.GetByIdAsync(id);

            if (returnRecord == null)
                return NotFound(new { message = "Return not found" });

            // Verify owner
            var contract = await _contractRepo.GetByIdAsync(returnRecord.ContractId);
            if (contract == null)
                return NotFound(new { message = "Contract not found" });

            var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, CancellationToken.None);
            if (warehouse == null || warehouse.OwnerId != userId)
                return Forbid("You are not authorized to reject this return");

            returnRecord.Reject(request.Reason);
            await _returnRepo.UpdateAsync(returnRecord);

            return Ok(new
            {
                message = "Return rejected",
                returnId = returnRecord.ReturnId,
                status = returnRecord.Status,
                reason = request.Reason
            });
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
    /// Complete return process
    /// </summary>
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteReturn(int id)
    {
        try
        {
            var returnRecord = await _returnRepo.GetByIdAsync(id);

            if (returnRecord == null)
                return NotFound(new { message = "Return not found" });

            returnRecord.Complete();
            await _returnRepo.UpdateAsync(returnRecord);

            return Ok(new
            {
                message = "Return completed successfully",
                returnId = returnRecord.ReturnId,
                status = returnRecord.Status
            });
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

    private object MapToDto(WarehouseReturn ret)
    {
        return new
        {
            returnId = ret.ReturnId,
            contractId = ret.ContractId,
            inspectorId = ret.InspectorId,
            inspectionDate = ret.InspectionDate,
            status = ret.Status,
            isClean = ret.IsClean,
            isEquipmentIntact = ret.IsEquipmentIntact,
            isNoOutstandingDebt = ret.IsNoOutstandingDebt,
            notes = ret.Notes,
            damageFee = ret.DamageFee,
            penaltyFee = ret.PenaltyFee,
            createdAt = ret.CreatedAt,
            updatedAt = ret.UpdatedAt
        };
    }
}

// Request DTOs
public class InitiateReturnRequest
{
    public int ContractId { get; set; }
}

public class InspectRequest
{
    public bool IsClean { get; set; }
    public bool IsEquipmentIntact { get; set; }
    public bool IsNoOutstandingDebt { get; set; }
    public string? Notes { get; set; }
    public decimal? DamageFee { get; set; }
    public decimal? PenaltyFee { get; set; }
}

public class ApproveReturnRequest
{
    public string? Notes { get; set; }
}

public class RejectReturnRequest
{
    public string Reason { get; set; } = string.Empty;
    public string? RequiredActions { get; set; }
}
