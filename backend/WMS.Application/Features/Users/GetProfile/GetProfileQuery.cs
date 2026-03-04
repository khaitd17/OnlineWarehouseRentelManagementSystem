using MediatR;

namespace WMS.Application.Features.Users.GetProfile;

public record GetProfileQuery(int UserId) : IRequest<UserProfileDto>;

public record UserProfileDto(
    int UserId,
    string FullName,
    string Email,
    string? Phone,
    string? AvatarUrl,
    string Status,
    string Role,
    DateTime? CreatedAt
);
