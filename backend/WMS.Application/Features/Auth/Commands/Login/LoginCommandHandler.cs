using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Constants;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, ApiResponse<LoginResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(IApplicationDbContext context, IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<ApiResponse<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user == null)
        {
            return ApiResponse<LoginResponse>.FailureResult("Invalid email or password");
        }

        bool isPasswordValid = false;
        try
        {
            isPasswordValid =request.Password.Equals(user.PasswordHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            isPasswordValid = request.Password.Equals(user.PasswordHash);
        }

        if (!isPasswordValid)
        {
            return ApiResponse<LoginResponse>.FailureResult("Invalid email or password");
        }

        if (user.Status == null || !user.Status.Equals(UserStatus.ACTIVE, StringComparison.OrdinalIgnoreCase))
        {
            return ApiResponse<LoginResponse>.FailureResult($"User account is {user.Status}");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return ApiResponse<LoginResponse>.SuccessResult(new LoginResponse(
            user.FullName,
            user.Email,
            user.Role.RoleName,
            token
        ), "Login successful");
    }
}
