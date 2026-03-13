using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Users.ChangePassword;

public class ChangePasswordHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IUserRepository _userRepo;

    public ChangePasswordHandler(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepo.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("Người dùng không tồn tại.");

        bool isValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
        if (!isValid)
            throw new InvalidOperationException("Mật khẩu hiện tại không chính xác.");

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        
        await _userRepo.UpdatePasswordAsync(user.UserId, newHash, cancellationToken);

        return true;
    }
}
