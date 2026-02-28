using MediatR;
using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.Auth.Commands.Login;

namespace WMS.API.Controllers;

public class AuthController : BaseController
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var response = await _mediator.Send(command);
        return HandleResponse(response);
    }
}
