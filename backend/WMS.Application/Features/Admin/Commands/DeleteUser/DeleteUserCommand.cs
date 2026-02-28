using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.DeleteUser;

public record DeleteUserCommand(int UserId) : IRequest<ApiResponse<bool>>;
