using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Auth.Login;

public class LoginHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IUserRepository _userRepo;
    private readonly IJwtService _jwtService;

    public LoginHandler(IUserRepository userRepo, IJwtService jwtService)
    {
        _userRepo = userRepo;
        _jwtService = jwtService;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepo.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        if (user.Status == "SUSPENDED" || user.Status == "DELETED")
            throw new UnauthorizedAccessException("Tài khoản của bạn đã bị khóa hoặc xóa.");

        bool isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isValid)
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        await _userRepo.UpdateLastLoginAsync(user.UserId, cancellationToken);

        string token = _jwtService.GenerateToken(user.UserId, user.Email, user.RoleName);

        return new LoginResult(
            user.UserId,
            user.FullName,
            user.Email,
            user.RoleName,
            token
        );
    }
}
