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

        // ── Module 6: New Password Strength Validation ──────────────────────
        if (string.IsNullOrWhiteSpace(request.NewPassword))
            throw new ArgumentException("Mật khẩu mới không được để trống.");
        if (request.NewPassword.Length < 8)
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 8 ký tự.");
        if (!request.NewPassword.Any(char.IsUpper))
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 1 chữ viết hoa.");
        if (!request.NewPassword.Any(char.IsLower))
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 1 chữ viết thường.");
        if (!request.NewPassword.Any(char.IsDigit))
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 1 chữ số.");
        if (request.NewPassword == request.CurrentPassword)
            throw new ArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        // ───────────────────────────────────────────────────────────────────

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        
        await _userRepo.UpdatePasswordAsync(user.UserId, newHash, cancellationToken);

        return true;
    }
}
