using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.UpdateAccountStatus;

public record UpdateAccountStatusCommand(
    int UserId,
    string Status
) : IRequest<ApiResponse<bool>>;
