using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Auth.ForgotPassword;

public class ForgotPasswordHandler : IRequestHandler<ForgotPasswordCommand, bool>
{
    private readonly IUserRepository _userRepo;
    private readonly IEmailService _emailService;

    public ForgotPasswordHandler(IUserRepository userRepo, IEmailService emailService)
    {
        _userRepo = userRepo;
        _emailService = emailService;
    }

    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepo.GetByEmailAsync(request.Email, cancellationToken);

        // Trả về true dù email có tồn tại hay không (bảo mật - tránh lộ thông tin)
        if (user == null) return true;

        // Xóa các token cũ chưa dùng
        await _userRepo.InvalidateOldTokensAsync(user.UserId, cancellationToken);

        // Tạo token ngẫu nhiên, mã hóa an toàn
        string rawToken = Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

        await _userRepo.SaveResetTokenAsync(
            userId: user.UserId,
            rawToken: rawToken,
            expiresAt: DateTime.UtcNow.AddHours(1),
            ct: cancellationToken
        );

        string resetLink = $"http://localhost:3000/reset-password?token={rawToken}";

        await _emailService.SendPasswordResetEmailAsync(
            toEmail: user.Email,
            toName: user.FullName,
            resetToken: rawToken,
            resetLink: resetLink
        );

        return true;
    }
}
