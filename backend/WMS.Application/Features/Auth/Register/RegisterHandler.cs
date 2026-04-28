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
        // ── Module 6: Auth / User Registration Validation ────────────────
        // Họ tên
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Họ tên không được để trống.");
        if (request.FullName.Trim().Length < 2 || request.FullName.Trim().Length > 100)
            throw new ArgumentException("Họ tên phải từ 2 đến 100 ký tự.");

        // Email
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email không được để trống.");
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.Email.Trim(),
            @"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"))
            throw new ArgumentException("Email không đúng định dạng.");
        if (request.Email.Length > 254)
            throw new ArgumentException("Email không được vượt quá 254 ký tự.");

        // Mật khẩu: ít nhất 8 ký tự, có chữ hoa, chữ thường, và số
        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Mật khẩu không được để trống.");
        if (request.Password.Length < 8)
            throw new ArgumentException("Mật khẩu phải có ít nhất 8 ký tự.");
        if (!request.Password.Any(char.IsUpper))
            throw new ArgumentException("Mật khẩu phải có ít nhất 1 chữ viết hoa.");
        if (!request.Password.Any(char.IsLower))
            throw new ArgumentException("Mật khẩu phải có ít nhất 1 chữ viết thường.");
        if (!request.Password.Any(char.IsDigit))
            throw new ArgumentException("Mật khẩu phải có ít nhất 1 chữ số.");

        // Số điện thoại Việt Nam (nếu có): 10-11 số, bắt đầu bằng 0
        if (!string.IsNullOrEmpty(request.Phone))
        {
            var phone = request.Phone.Trim();
            if (!System.Text.RegularExpressions.Regex.IsMatch(phone, @"^0\d{9,10}$"))
                throw new ArgumentException("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0).");
        }
        // ───────────────────────────────────────────────────────────────────

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
