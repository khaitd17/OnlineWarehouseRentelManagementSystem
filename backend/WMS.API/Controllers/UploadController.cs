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

            // Validate file type (only images)
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Only image files (JPG, PNG) and PDF are allowed" });

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File size must not exceed 5MB" });

            // Create uploads directory if not exists
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "contracts");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative URL
            var fileUrl = $"/uploads/contracts/{uniqueFileName}";

            return Ok(new
            {
                message = "File uploaded successfully",
                url = fileUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading contract file");
            return StatusCode(500, new { message = "An error occurred while uploading the file", error = ex.Message });
        }
    }
}
