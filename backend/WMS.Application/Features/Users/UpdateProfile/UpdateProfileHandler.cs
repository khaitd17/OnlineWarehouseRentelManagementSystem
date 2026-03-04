using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Users.UpdateProfile;

public class UpdateProfileHandler : IRequestHandler<UpdateProfileCommand, bool>
{
    private readonly IUserRepository _userRepo;

    public UpdateProfileHandler(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<bool> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException($"Không tìm thấy người dùng với ID {request.UserId}.");

        return await _userRepo.UpdateProfileAsync(request, cancellationToken);
    }
}
