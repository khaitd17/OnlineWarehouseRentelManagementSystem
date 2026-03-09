using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Auth.Register;

public class RegisterHandler : IRequestHandler<RegisterCommand, int>
{
    private readonly IUserRepository _userRepo;

    public RegisterHandler(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public async Task<int> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Kiểm tra email đã tồn tại chưa
        var existing = await _userRepo.GetByEmailAsync(request.Email, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException("Email này đã được sử dụng.");

        // Hash password bằng BCrypt
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var dto = new CreateUserDto(
            FullName: request.FullName,
            Email: request.Email,
            PasswordHash: passwordHash,
            Phone: request.Phone,
            RoleName: request.RoleName
        );

        return await _userRepo.CreateAsync(dto, cancellationToken);
    }
}
