using Microsoft.EntityFrameworkCore;
using WMS.Application.Features.Users.UpdateProfile;
using WMS.Application.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;
using SystemTask = System.Threading.Tasks.Task;

namespace WMS.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _db;

    public UserRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async System.Threading.Tasks.Task<UserRecord?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email, ct);
        return user == null ? null : MapToRecord(user);
    }

    public async System.Threading.Tasks.Task<UserRecord?> GetByIdAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId, ct);
        return user == null ? null : MapToRecord(user);
    }

    public async System.Threading.Tasks.Task<int> CreateAsync(CreateUserDto dto, CancellationToken ct = default)
    {
        string roleName = string.IsNullOrWhiteSpace(dto.RoleName) ? "RENTER" : dto.RoleName.ToUpper();
        
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName, ct);
        if (role == null)
        {
            // Fallback to "RENTER" if provided role is not found, or throw exception.
            throw new InvalidOperationException($"Role '{roleName}' không tồn tại trong hệ thống.");
        }
        
        int roleId = role.RoleId;

        var user = new User
        {
            RoleId = roleId,
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = dto.PasswordHash,
            Phone = dto.Phone,
            Status = "ACTIVE",
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return user.UserId;
    }

    public async System.Threading.Tasks.Task<bool> UpdateProfileAsync(UpdateProfileCommand cmd, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == cmd.UserId, ct);
        if (user == null) return false;

        user.FullName = cmd.FullName;
        user.Phone = cmd.Phone;
        user.AvatarUrl = cmd.AvatarUrl;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async SystemTask UpdateLastLoginAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user != null)
        {
            user.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async System.Threading.Tasks.Task<bool> UpdatePasswordAsync(int userId, string newPasswordHash, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user == null) return false;

        user.PasswordHash = newPasswordHash;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async SystemTask SaveResetTokenAsync(int userId, string rawToken, DateTime expiresAt, CancellationToken ct = default)
    {
        var tokenRecord = new PasswordResetToken
        {
            UserId = userId,
            Token = rawToken,
            ExpiresAt = expiresAt,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.PasswordResetTokens.Add(tokenRecord);
        await _db.SaveChangesAsync(ct);
    }

    public async SystemTask InvalidateOldTokensAsync(int userId, CancellationToken ct = default)
    {
        var tokens = await _db.PasswordResetTokens
            .Where(t => t.UserId == userId && !t.IsUsed)
            .ToListAsync(ct);
        _db.PasswordResetTokens.RemoveRange(tokens);
        await _db.SaveChangesAsync(ct);
    }

    public async System.Threading.Tasks.Task<int?> GetUserIdByValidTokenAsync(string rawToken, CancellationToken ct = default)
    {
        var record = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == rawToken && !t.IsUsed, ct);

        if (record == null || record.ExpiresAt < DateTime.UtcNow)
            return null;

        return record.UserId;
    }

    public async System.Threading.Tasks.Task<string?> GetResetTokenAsync(string rawToken, CancellationToken ct = default)
    {
        var record = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == rawToken && !t.IsUsed, ct);
        return record?.Token;
    }

    public async SystemTask MarkTokenUsedAsync(string rawToken, CancellationToken ct = default)
    {
        var record = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == rawToken, ct);
        if (record != null)
        {
            record.IsUsed = true;
            await _db.SaveChangesAsync(ct);
        }
    }

    private static UserRecord MapToRecord(User u) => new(
        u.UserId,
        u.FullName,
        u.Email,
        u.PasswordHash,
        u.Phone,
        u.AvatarUrl,
        u.Status,
        u.Role.RoleName,
        u.CreatedAt
    );

    public async Task<int?> IsExistEmail(string email, CancellationToken ct = default)
    {
        return await _db.Users
            .Where(x => x.Email == email)
            .Select(x => (int?)x.UserId)
            .FirstOrDefaultAsync(ct);
    }

}
