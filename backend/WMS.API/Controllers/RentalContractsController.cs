using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Application.Features.RentalContracts.GetRentalContractById;
using WMS.Application.Features.RentalContracts.GetMyRentalContracts;
using WMS.Application.Features.RentalContracts.GetContractsByWarehouse;
using WMS.Application.Features.RentalContracts.SendContractOtp;
using WMS.Application.Features.RentalContracts.VerifyContractOtp;
using WMS.Application.Features.RentalContracts.SignContract;
using WMS.Application.Features.RentalContracts.GetContractLogs;
using WMS.Application.Features.RentalContracts.OwnerSignContract;
using WMS.Application.Features.RentalContracts.DeclineContract;
using WMS.Application.Features.RentalContracts.ExtendContract;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/rental-contracts")]
[Authorize]
public class RentalContractsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWebHostEnvironment _env;
    private readonly ApplicationDbContext _db;
    private readonly IRentalAreaRepository _rentalAreaRepo;

    public RentalContractsController(IMediator mediator, IRentalContractRepository contractRepo, IWebHostEnvironment env, ApplicationDbContext db, IRentalAreaRepository rentalAreaRepo)
    {
        _mediator = mediator;
        _contractRepo = contractRepo;
        _env = env;
        _db = db;
        _rentalAreaRepo = rentalAreaRepo;
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
            return StatusCode(403, new { message = ex.Message });
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

    /// <summary>Tất cả hợp đồng thuê kho của Owner (gom từ mọi kho họ sở hữu)</summary>
    [HttpGet("owner-contracts")]
    public async Task<IActionResult> GetOwnerContracts()
    {
        try
        {
            var ownerId = GetUserId();
            // Use _db.Contracts which maps to "contracts" table where actual data is stored
            var contracts = await _db.Contracts
                .Include(c => c.Warehouse)
                .Include(c => c.Renter)
                .Include(c => c.Request)
                .Where(c => c.Warehouse != null && c.Warehouse.OwnerId == ownerId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.ContractId,
                    c.ContractNumber,
                    c.Status,
                    c.StartDate,
                    c.EndDate,
                    c.MonthlyPayment,
                    c.TotalValue,
                    c.CreatedAt,
                    RequestedArea = c.Request != null ? c.Request.RequestedArea : 0,
                    WarehouseId   = c.Warehouse!.WarehouseId,
                    WarehouseName = c.Warehouse.Name,
                    WarehouseAddress = c.Warehouse.Address,
                    RenterId  = c.Renter != null ? c.Renter.UserId : 0,
                    RenterName  = c.Renter != null ? c.Renter.FullName  : "—",
                    RenterEmail = c.Renter != null ? c.Renter.Email     : "—",
                    RenterPhone = c.Renter != null ? c.Renter.Phone     : null,
                })
                .ToListAsync();

            return Ok(contracts);
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
            return StatusCode(403, new { message = ex.Message });
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
            return StatusCode(403, new { message = ex.Message });
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
            return StatusCode(403, new { message = ex.Message });
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
            return StatusCode(403, new { message = ex.Message });
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
            return StatusCode(403, new { message = ex.Message });
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
            return StatusCode(403, new { message = ex.Message });
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

    [HttpGet("{id}/signing-history")]
    public async Task<IActionResult> GetSigningHistory(int id)
    {
        try
        {
            var userId = GetUserId();

            // Read from contracts table (what RentalContractRepository writes to)
            var contract = await _db.Contracts
                .Include(c => c.Warehouse)
                .Include(c => c.Renter)
                .FirstOrDefaultAsync(c => c.ContractId == id);

            if (contract == null)
                return NotFound(new { message = "Contract not found" });

            // Get owner name from warehouse
            var ownerName = contract.Warehouse != null
                ? await _db.Users
                    .Where(u => u.UserId == contract.Warehouse.OwnerId)
                    .Select(u => u.FullName)
                    .FirstOrDefaultAsync() ?? "Chủ kho"
                : "Chủ kho";
            var ownerId = contract.Warehouse?.OwnerId ?? 0;

            var renterName = contract.Renter?.FullName ?? "Người thuê";
            var renterId = contract.RenterId;

            // Build signing history from contract data
            var history = new List<object>();

            // Helper to ensure DateTime is marked as UTC for correct JSON serialization
            DateTime? ToUtc(DateTime? dt) => dt.HasValue
                ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc)
                : null;

            // Contract created — attribute to the owner who initiated it
            history.Add(new
            {
                action = "Tạo hợp đồng",
                timestamp = ToUtc(contract.CreatedAt),
                completed = true,
                userName = ownerName,
                eventUserId = ownerId
            });

            // Owner signed
            if (contract.OwnerSignedAt.HasValue)
            {
                history.Add(new
                {
                    action = "Chủ kho ký hợp đồng",
                    timestamp = ToUtc(contract.OwnerSignedAt),
                    completed = true,
                    userName = ownerName,
                    eventUserId = ownerId,
                    signatureUrl = contract.OwnerSignatureBase64 != null
                        ? $"data:image/png;base64,{contract.OwnerSignatureBase64}"
                        : null
                });
            }

            // Renter signed
            if (contract.SignedAt.HasValue)
            {
                history.Add(new
                {
                    action = "Người thuê ký hợp đồng",
                    timestamp = ToUtc(contract.SignedAt),
                    completed = true,
                    userName = renterName,
                    eventUserId = renterId,
                    signatureUrl = contract.RenterSignatureBase64 != null
                        ? $"data:image/png;base64,{contract.RenterSignatureBase64}"
                        : null
                });
            }

            return Ok(new
            {
                currentUserId = userId,
                events = history
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }


    /// <summary>
    /// Get contract audit logs (status changes, actions)
    /// </summary>
    [HttpGet("{id}/audit-logs")]
    public async Task<IActionResult> GetAuditLogs(int id)
    {
        try
        {
            var userId = GetUserId();

            // Use the same logs query but format differently
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
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Download contract PDF
    /// </summary>
    [HttpGet("{id}/download-pdf")]
    public async Task<IActionResult> DownloadContractPdf(int id)
    {
        try
        {
            var userId = GetUserId();
            var contract = await _contractRepo.GetByIdAsync(id);

            if (contract == null)
                return NotFound(new { message = "Contract not found" });

            // Determine which PDF to return
            string? pdfUrl = contract.SignedFileUrl
                ?? contract.OwnerSignedFileUrl
                ?? contract.ContractFileUrl;

            if (string.IsNullOrEmpty(pdfUrl))
            {
                return NotFound(new { message = "No PDF available for this contract" });
            }

            // PDFs are generated into {ContentRoot}/uploads/contracts
            var sourceFileName = Path.GetFileName(pdfUrl);
            var filePath = Path.Combine(_env.ContentRootPath, "uploads", "contracts", sourceFileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "PDF file not found" });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var fileName = $"HopDong_{contract.ContractNumber}.pdf";

            return File(fileBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }
    
    /// <summary>
    /// Decline contract before signing (Renter or Owner)
    /// </summary>
    [HttpPost("{id}/decline")]
    public async Task<IActionResult> DeclineContract(int id, [FromBody] DeclineContractDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Decline reason is required" });

            var command = new DeclineContractCommand
            {
                ContractId = id,
                UserId = GetUserId(),
                Reason = dto.Reason
            };

            await _mediator.Send(command);

            return Ok(new { message = "Contract declined successfully" });
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
    /// Owner phân / đổi khu cho hợp đồng.
    /// Nếu body.RentalAreaId có giá trị → gán thẳng khu đó.
    /// Nếu không → auto best-fit (zone nhỏ nhất đủ thể tích, còn trống).
    /// Cho phép gọi nhiều lần để đổi khu.
    /// </summary>
    [HttpPost("{id}/assign-area")]
    public async Task<IActionResult> AssignRentalArea(int id, [FromBody] AssignAreaRequest? body = null)
    {
        try
        {
            var ownerId = GetUserId();

            // Lấy hợp đồng + request liên kết
            var contract = await _db.Contracts
                .Include(c => c.Warehouse)
                .Include(c => c.Request)
                .FirstOrDefaultAsync(c => c.ContractId == id);

            if (contract == null)
                return NotFound(new { message = "Hợp đồng không tồn tại." });

            // Chỉ chủ kho mới được phân khu
            if (contract.Warehouse?.OwnerId != ownerId)
                return StatusCode(403, new { message = "Bạn không phải chủ kho này." });

            if (contract.Request == null)
                return BadRequest(new { message = "Hợp đồng không có yêu cầu thuê liên kết." });

            var needed = contract.Request.RequestedArea;
            var currentAreaId = contract.Request.RentalAreaId; // khu hiện tại (nếu đã có)

            // Lấy tất cả zone có occupancy
            var allAreas = await _rentalAreaRepo
                .GetWithOccupancyByWarehouseIdAsync(contract.WarehouseId, CancellationToken.None);

            // Zone này có "trống" với ngữ cảnh hiện tại không?
            // (khu đang gán cho chính hợp đồng này thì coi như trống để có thể reassign sang khu khác)
            bool IsAvailableForThis(WMS.Domain.Entities.RentalArea a) =>
                !a.IsOccupied || a.Id == currentAreaId;

            WMS.Domain.Entities.RentalArea? candidate;

            if (body?.RentalAreaId.HasValue == true)
            {
                // ── Gán thẳng khu do owner chỉ định ──────────────────────
                candidate = allAreas.FirstOrDefault(a => a.Id == body.RentalAreaId.Value);
                if (candidate == null)
                    return BadRequest(new { message = "Ô khu không tồn tại trong kho này." });

                if (!IsAvailableForThis(candidate))
                    return BadRequest(new { message = $"Ô khu '{candidate.Name}' đang được thuê bởi hợp đồng khác." });
            }
            else
            {
                // ── Auto best-fit ──────────────────────────────────────────
                candidate = allAreas
                    .Where(a => IsAvailableForThis(a) && a.Size >= needed)
                    .OrderBy(a => a.Size)
                    .FirstOrDefault();

                if (candidate == null)
                    return BadRequest(new { message = $"Không có ô khu trống nào đủ {needed} m³. Vui lòng thêm ô khu mới hoặc giãn ra sau." });
            }

            // Gán / Đổi khu cho request
            contract.Request.RentalAreaId = candidate.Id;
            contract.Request.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var action = currentAreaId == null ? "Đã phân" : "Đã đổi sang";
            return Ok(new
            {
                message = $"{action} '{candidate.Name}' ({candidate.Size} m³) cho hợp đồng này.",
                rentalAreaId = candidate.Id,
                name = candidate.Name,
                size = candidate.Size
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
        }
    }

    /// <summary>
    /// Extend contract (creates extension payment)
    /// </summary>
    [HttpPost("{id}/extend")]
    public async Task<IActionResult> ExtendContract(int id, [FromBody] ExtendContractRequest request)
    {
        try
        {
            var userId = GetUserId();

            var command = new ExtendContractCommand
            {
                ContractId = id,
                ExtensionMonths = request.ExtensionMonths,
                RequestedBy = userId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Manager/Operator tra cứu thông tin sức chứa hợp đồng của 1 renter trong kho.
    /// Trả về: diện tích hợp đồng, tổng tồn kho hiện tại, còn có thể nhập.
    /// </summary>
    [HttpGet("renter-capacity")]
    public async Task<IActionResult> GetRenterCapacity(
        [FromQuery] int renterId,
        [FromQuery] int warehouseId,
        CancellationToken ct)
    {
        const double KgPerM3 = 500.0;

        // Lấy diện tích hợp đồng (m³)
        double contractedArea = await _contractRepo.GetContractedAreaAsync(renterId, warehouseId, ct);

        // Lấy tên & email renter
        var renter = await _db.Users
            .Where(u => u.UserId == renterId)
            .Select(u => new { u.FullName, u.Email })
            .FirstOrDefaultAsync(ct);

        // Tính tổng thể tích đang lưu kho (m³) từ các phiếu đã duyệt (CONFIRMED/ASSIGNED/COMPLETED)
        var inboundStatuses = new[] { "CONFIRMED", "ASSIGNED", "COMPLETED" };

        var confirmedInboundVolume = await _db.InventoryRequests
            .Where(r => r.RenterId == renterId
                     && r.WarehouseId == warehouseId
                     && r.Type == "INBOUND"
                     && inboundStatuses.Contains(r.Status!))
            .SelectMany(r => r.InventoryItems)
            .SumAsync(i => (double?)(i.EstimatedVolume ?? 0), ct) ?? 0.0;

        var confirmedOutboundVolume = await _db.InventoryRequests
            .Where(r => r.RenterId == renterId
                     && r.WarehouseId == warehouseId
                     && r.Type == "OUTBOUND"
                     && inboundStatuses.Contains(r.Status!))
            .SelectMany(r => r.InventoryItems)
            .SumAsync(i => (double?)(i.EstimatedVolume ?? 0), ct) ?? 0.0;

        double currentVolumeM3 = Math.Max(0, confirmedInboundVolume - confirmedOutboundVolume);
        double remainingM3     = Math.Max(0, contractedArea - currentVolumeM3);
        double maxWeightKg     = contractedArea * KgPerM3;
        double usagePercent    = contractedArea > 0
            ? Math.Round(currentVolumeM3 / contractedArea * 100, 1)
            : 0;

        return Ok(new
        {
            renterId,
            renterName       = renter?.FullName ?? "—",
            renterEmail      = renter?.Email    ?? "—",
            warehouseId,
            contractedAreaM3 = contractedArea,
            currentVolumeM3,
            remainingM3,
            usagePercent,
            maxWeightKg,
            hasContract      = contractedArea > 0,
        });
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

public class DeclineContractDto
{
    public string Reason { get; set; } = null!;
}

public class ExtendContractRequest
{
    public int ExtensionMonths { get; set; }
}

public class AssignAreaRequest
{
    /// <summary>Nếu có giá trị → gán khu cụ thể này. Nếu null → auto best-fit.</summary>
    public int? RentalAreaId { get; set; }
}
