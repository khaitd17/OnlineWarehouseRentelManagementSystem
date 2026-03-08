using MediatR;

namespace WMS.Application.Features.Users.ChangePassword;

public record ChangePasswordCommand(int UserId, string CurrentPassword, string NewPassword) : IRequest<bool>;
