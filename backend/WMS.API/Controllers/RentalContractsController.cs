using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WMS.Application.Features.RentalContracts.GetRentalContractById;
using WMS.Application.Features.RentalContracts.GetMyRentalContracts;
using WMS.Application.Features.RentalContracts.GetContractsByWarehouse;
using WMS.Application.Features.RentalContracts.SendContractOtp;
using WMS.Application.Features.RentalContracts.VerifyContractOtp;
using WMS.Application.Features.RentalContracts.SignContract;
using WMS.Application.Features.RentalContracts.GetContractLogs;
using WMS.Application.Features.RentalContracts.OwnerSignContract;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/rental-contracts")]
[Authorize]
public class RentalContractsController : ControllerBase
{
    private readonly IMediator _mediator;

    public RentalContractsController(IMediator mediator)
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRentalContractById(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _mediator.Send(new GetRentalContractByIdQuery
            {
                ContractId = id,
                UserId = userId
            });

            if (result == null)
                return NotFound(new { message = "Rental contract not found" });

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

    [HttpGet("my-contracts")]
    public async Task<IActionResult> GetMyRentalContracts()
    {
        try
        {
            var userId = GetUserId();
            var result = await _mediator.Send(new GetMyRentalContractsQuery { UserId = userId });
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<IActionResult> GetContractsByWarehouse(int warehouseId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _mediator.Send(new GetContractsByWarehouseQuery
            {
                WarehouseId = warehouseId,
                OwnerId = userId
            });
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    [HttpPost("{id}/send-otp")]
    public async Task<IActionResult> SendContractOtp(int id)
    {
        try
        {
            var userId = GetUserId();
            await _mediator.Send(new SendContractOtpCommand
            {
                ContractId = id,
                UserId = userId
            });
            return Ok(new { message = "OTP sent successfully" });
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

    [HttpPost("{id}/verify-otp")]
    public async Task<IActionResult> VerifyContractOtp(int id, [FromBody] VerifyOtpRequest body)
    {
        try
        {
            var userId = GetUserId();
            await _mediator.Send(new VerifyContractOtpCommand
            {
                ContractId = id,
                UserId = userId,
                OtpCode = body.OtpCode
            });
            return Ok(new { message = "OTP verified successfully" });
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

    [HttpPost("{id}/owner-sign")]
    public async Task<IActionResult> OwnerSignContract(int id, [FromBody] SignContractRequest body)
    {
        try
        {
            var userId = GetUserId();
            var result = await _mediator.Send(new OwnerSignContractCommand
            {
                ContractId = id,
                OwnerId = userId,
                SignatureBase64 = body.SignatureBase64
            });
            return Ok(result);
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
            return StatusCode(500, new { message = "An error occurred", error = ex.Message, detail = ex.ToString() });
        }
    }

    [HttpPost("{id}/sign")]
    public async Task<IActionResult> SignContract(int id, [FromBody] SignContractRequest body)
    {
        try
        {
            var userId = GetUserId();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            var result = await _mediator.Send(new SignContractCommand
            {
                ContractId = id,
                UserId = userId,
                SignatureBase64 = body.SignatureBase64,
                IpAddress = ipAddress
            });
            return Ok(result);
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
            return StatusCode(500, new { message = "An error occurred", error = ex.Message, detail = ex.ToString() });
        }
    }

    [HttpGet("{id}/logs")]
    public async Task<IActionResult> GetContractLogs(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _mediator.Send(new GetContractLogsQuery
            {
                ContractId = id,
                UserId = userId
            });
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }
}

public class VerifyOtpRequest
{
    public string OtpCode { get; set; } = null!;
}

public class SignContractRequest
{
    public string SignatureBase64 { get; set; } = null!;
}
