using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Auth.ResetPassword;

public class ResetPasswordHandler : IRequestHandler<ResetPasswordCommand, bool>
{
    private readonly IUserRepository _userRepo;

    public ResetPasswordHandler(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        // Lấy userId nếu token hợp lệ và chưa hết hạn
        int? userId = await _userRepo.GetUserIdByValidTokenAsync(request.Token, cancellationToken);

        if (userId == null)
            throw new InvalidOperationException("Token không hợp lệ, đã hết hạn hoặc đã được sử dụng.");

        string newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _userRepo.UpdatePasswordAsync(userId.Value, newHash, cancellationToken);

        // Đánh dấu token đã dùng
        await _userRepo.MarkTokenUsedAsync(request.Token, cancellationToken);

        return true;
    }
}
