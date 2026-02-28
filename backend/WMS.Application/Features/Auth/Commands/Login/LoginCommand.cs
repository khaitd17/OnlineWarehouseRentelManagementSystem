using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Auth.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<ApiResponse<LoginResponse>>;

public record LoginResponse(string FullName, string Email, string Role, string Token);
