using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Users.GetProfile;

public class GetProfileHandler : IRequestHandler<GetProfileQuery, UserProfileDto>
{
    private readonly IUserRepository _userRepo;

    public GetProfileHandler(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<UserProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepo.GetByIdAsync(request.UserId, cancellationToken);

        if (user == null)
            throw new KeyNotFoundException($"Không tìm thấy người dùng với ID {request.UserId}.");

        return new UserProfileDto(
            user.UserId,
            user.FullName,
            user.Email,
            user.Phone,
            user.AvatarUrl,
            user.Status ?? "ACTIVE",
            user.RoleName,
            user.CreatedAt
        );
    }
}
