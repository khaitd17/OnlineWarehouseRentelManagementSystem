using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/contract-templates")]
[Authorize]
public class ContractTemplatesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ContractTemplatesController(ApplicationDbContext db)
    {
        _db = db;
    }

    private int GetUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(userId))
            throw new UnauthorizedAccessException("User not found");
        return int.Parse(userId);
    }

    [HttpGet("owner")]
    public async Task<IActionResult> GetOwnerTemplates()
    {
        try
        {
            var ownerId = GetUserId();
            var templates = await _db.OwnerContractTemplates
                .Where(x => x.OwnerId == ownerId)
                .OrderByDescending(x => x.IsDefault)
                .ThenByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    x.TemplateId,
                    x.TemplateName,
                    x.UseBasicInfoSection,
                    x.UsePaymentSection,
                    x.UseViolationSection,
                    x.UseTerminationSection,
                    x.UseSignatureSection,
                    x.BasicInfoContent,
                    x.PaymentContent,
                    x.ViolationContent,
                    x.TerminationContent,
                    x.SignatureContent,
                    x.AdditionalTermsContent,
                    x.IsDefault,
                    x.CreatedAt,
                    x.UpdatedAt
                })
                .ToListAsync();

            return Ok(templates);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tải danh sách template", error = ex.Message });
        }
    }

    [HttpGet("owner/default")]
    public async Task<IActionResult> GetOwnerDefaultTemplate()
    {
        try
        {
            var ownerId = GetUserId();
            var template = await _db.OwnerContractTemplates
                .Where(x => x.OwnerId == ownerId && x.IsDefault)
                .Select(x => new
                {
                    x.TemplateId,
                    x.TemplateName,
                    x.UseBasicInfoSection,
                    x.UsePaymentSection,
                    x.UseViolationSection,
                    x.UseTerminationSection,
                    x.UseSignatureSection,
                    x.BasicInfoContent,
                    x.PaymentContent,
                    x.ViolationContent,
                    x.TerminationContent,
                    x.SignatureContent,
                    x.AdditionalTermsContent
                })
                .FirstOrDefaultAsync();

            return Ok(template);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tải template mặc định", error = ex.Message });
        }
    }

    [HttpPost("owner")]
    public async Task<IActionResult> CreateOwnerTemplate([FromBody] CreateOwnerTemplateDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.TemplateName))
                return BadRequest(new { message = "Tên template là bắt buộc" });

            var hasAnySectionEnabled =
                dto.UseBasicInfoSection ||
                dto.UsePaymentSection ||
                dto.UseViolationSection ||
                dto.UseTerminationSection ||
                dto.UseSignatureSection;
            if (!hasAnySectionEnabled)
                return BadRequest(new { message = "Cần bật ít nhất 1 nhóm trường trong template" });

            var ownerId = GetUserId();
            var template = new OwnerContractTemplate
            {
                OwnerId = ownerId,
                TemplateName = dto.TemplateName.Trim(),
                UseBasicInfoSection = dto.UseBasicInfoSection,
                UsePaymentSection = dto.UsePaymentSection,
                UseViolationSection = dto.UseViolationSection,
                UseTerminationSection = dto.UseTerminationSection,
                UseSignatureSection = dto.UseSignatureSection,
                BasicInfoContent = string.IsNullOrWhiteSpace(dto.BasicInfoContent) ? null : dto.BasicInfoContent.Trim(),
                PaymentContent = string.IsNullOrWhiteSpace(dto.PaymentContent) ? null : dto.PaymentContent.Trim(),
                ViolationContent = string.IsNullOrWhiteSpace(dto.ViolationContent) ? null : dto.ViolationContent.Trim(),
                TerminationContent = string.IsNullOrWhiteSpace(dto.TerminationContent) ? null : dto.TerminationContent.Trim(),
                SignatureContent = string.IsNullOrWhiteSpace(dto.SignatureContent) ? null : dto.SignatureContent.Trim(),
                AdditionalTermsContent = string.IsNullOrWhiteSpace(dto.AdditionalTermsContent) ? null : dto.AdditionalTermsContent.Trim(),
                IsDefault = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.OwnerContractTemplates.Add(template);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo template hợp đồng thành công",
                templateId = template.TemplateId
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tạo template hợp đồng", error = ex.Message });
        }
    }

    [HttpPut("owner/{templateId}/default")]
    public async Task<IActionResult> SetDefaultTemplate(int templateId)
    {
        try
        {
            var ownerId = GetUserId();
            var template = await _db.OwnerContractTemplates
                .FirstOrDefaultAsync(x => x.TemplateId == templateId && x.OwnerId == ownerId);
            if (template == null)
                return NotFound(new { message = "Không tìm thấy template" });

            var ownerTemplates = await _db.OwnerContractTemplates
                .Where(x => x.OwnerId == ownerId && x.IsDefault)
                .ToListAsync();

            foreach (var item in ownerTemplates)
            {
                item.IsDefault = false;
                item.UpdatedAt = DateTime.UtcNow;
            }

            template.IsDefault = true;
            template.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã đặt template mặc định thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể cập nhật template mặc định", error = ex.Message });
        }
    }

    public class CreateOwnerTemplateDto
    {
        public string TemplateName { get; set; } = string.Empty;
        public bool UseBasicInfoSection { get; set; }
        public bool UsePaymentSection { get; set; }
        public bool UseViolationSection { get; set; }
        public bool UseTerminationSection { get; set; }
        public bool UseSignatureSection { get; set; }
        public string? BasicInfoContent { get; set; }
        public string? PaymentContent { get; set; }
        public string? ViolationContent { get; set; }
        public string? TerminationContent { get; set; }
        public string? SignatureContent { get; set; }
        public string? AdditionalTermsContent { get; set; }
    }
}
