using Microsoft.AspNetCore.Mvc;
using WMS.Application.Common.Models;

namespace WMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    protected IActionResult HandleResponse<T>(ApiResponse<T> response)
    {
        if (response.Success)
        {
            return Ok(response);
        }

        return BadRequest(response);
    }
}
