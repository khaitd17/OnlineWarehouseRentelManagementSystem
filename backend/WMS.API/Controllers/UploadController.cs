using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IWebHostEnvironment environment, ILogger<UploadController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("contract")]
    public async Task<IActionResult> UploadContract(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Only image files (JPG, PNG) and PDF are allowed" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File size must not exceed 5MB" });

            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "contracts");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/contracts/{uniqueFileName}";
            return Ok(new { message = "File uploaded successfully", url = fileUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading contract file");
            return StatusCode(500, new { message = "An error occurred while uploading the file", error = ex.Message });
        }
    }

    // ── POST /api/Upload/inventory-documents ──────────────────────────────────
    /// <summary>Upload chứng từ nhập/xuất kho (invoice, packing list, v.v.)</summary>
    [HttpPost("inventory-documents")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadInventoryDocuments([FromForm] IFormFileCollection files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "Chưa có file nào được tải lên." });

            if (files.Count > 10)
                return BadRequest(new { message = "Tối đa 10 file được phép upload mỗi lần." });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf", ".xlsx", ".xls", ".doc", ".docx" };

            var uploadFolder = Path.Combine(_environment.ContentRootPath, "uploads", "inventory-docs");
            if (!Directory.Exists(uploadFolder))
                Directory.CreateDirectory(uploadFolder);

            var urls = new List<string>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { message = $"File '{file.FileName}' không hợp lệ. Chỉ chấp nhận: PDF, ảnh (JPG/PNG), Excel, Word." });

                if (file.Length > 10 * 1024 * 1024)
                    return BadRequest(new { message = $"File '{file.FileName}' vượt giới hạn 10MB." });

                var uniqueName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadFolder, uniqueName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                urls.Add($"/uploads/inventory-docs/{uniqueName}");
            }

            return Ok(new
            {
                message = $"Đã upload thành công {urls.Count} file.",
                urls
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading inventory documents");
            return StatusCode(500, new { message = "Lỗi khi upload chứng từ.", error = ex.Message });
        }
    }

    // ── POST /api/Upload/incident-attachments ──────────────────────────────
    [HttpPost("incident-attachments")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadIncidentAttachments([FromForm] IFormFileCollection files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "Chưa có file nào được tải lên." });

            if (files.Count > 5)
                return BadRequest(new { message = "Tối đa 5 file mỗi báo cáo." });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".mp4", ".mov", ".avi", ".webm" };
            
            var uploadFolder = Path.Combine(_environment.ContentRootPath, "uploads", "incident-attachments");
            if (!Directory.Exists(uploadFolder))
                Directory.CreateDirectory(uploadFolder);

            var results = new List<object>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var lowerExtension = extension.ToLowerInvariant();
                if (!allowedExtensions.Contains(lowerExtension))
                    return BadRequest(new { message = $"File '{file.FileName}' không được hỗ trợ. Chỉ chấp nhận ảnh và video." });

                if (file.Length > 50 * 1024 * 1024) // 50MB limit
                    return BadRequest(new { message = $"File '{file.FileName}' vượt giới hạn 50MB." });

                var uniqueName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadFolder, uniqueName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                var type = (lowerExtension == ".mp4" || lowerExtension == ".mov" || lowerExtension == ".avi" || lowerExtension == ".webm") ? "VIDEO" : "IMAGE";
                
                results.Add(new
                {
                    fileUrl = $"/uploads/incident-attachments/{uniqueName}",
                    fileType = type
                });
            }

            return Ok(new
            {
                message = $"Đã upload thành công {results.Count} file.",
                attachments = results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading incident attachments");
            return StatusCode(500, new { message = "Lỗi khi upload tệp đính kèm.", error = ex.Message });
        }
    }
}

