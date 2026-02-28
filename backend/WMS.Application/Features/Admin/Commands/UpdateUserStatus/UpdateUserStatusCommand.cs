using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.UpdateUserStatus;

public record UpdateUserStatusCommand(int UserId, string Status) : IRequest<ApiResponse<bool>>;
