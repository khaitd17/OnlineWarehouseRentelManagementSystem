using WMS.Application.Features.Auth.ForgotPassword;
using WMS.Application.Features.Auth.ResetPassword;
using WMS.Application.Features.Users.GetProfile;
using WMS.Application.Features.Users.UpdateProfile;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;

namespace WMS.Application.Interfaces;

// DTOs/Models that application layer can use without Infrastructure dependency
public interface IUserRepository
{
    Task<UserRecord?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<UserRecord?> GetByIdAsync(int userId, CancellationToken ct = default);
    Task<int> CreateAsync(CreateUserDto dto, CancellationToken ct = default);
    Task<bool> UpdateProfileAsync(UpdateProfileCommand cmd, CancellationToken ct = default);
    Task UpdateLastLoginAsync(int userId, CancellationToken ct = default);
    Task<bool> UpdatePasswordAsync(int userId, string newPasswordHash, CancellationToken ct = default);

    Task<string?> GetResetTokenAsync(string rawToken, CancellationToken ct = default); // returns userId as string if valid
    Task<int?> GetUserIdByValidTokenAsync(string rawToken, CancellationToken ct = default);
    Task SaveResetTokenAsync(int userId, string rawToken, DateTime expiresAt, CancellationToken ct = default);
    Task InvalidateOldTokensAsync(int userId, CancellationToken ct = default);
    Task MarkTokenUsedAsync(string rawToken, CancellationToken ct = default);
    Task<int?> IsExistEmail(string email, CancellationToken ct = default);
    //Task<User> AddAsync(User user, CancellationToken ct = default);

}

public record UserRecord(
    int UserId,
    string FullName,
    string Email,
    string PasswordHash,
    string? Phone,
    string? AvatarUrl,
    string? Status,
    string RoleName,
    DateTime? CreatedAt
);

public record CreateUserDto(
    string FullName,
    string Email,
    string PasswordHash,
    string? Phone,
    string RoleName
);
