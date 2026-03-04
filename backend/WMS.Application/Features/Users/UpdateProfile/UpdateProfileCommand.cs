using MediatR;

namespace WMS.Application.Features.Users.UpdateProfile;

public record UpdateProfileCommand(
    int UserId,
    string FullName,
    string? Phone,
    string? AvatarUrl
) : IRequest<bool>;
