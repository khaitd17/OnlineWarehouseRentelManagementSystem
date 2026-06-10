using Moq;
using WMS.Application.Features.Auth.Login;
using WMS.Application.Interfaces;

namespace WMS.UnitTests.Auth;

/// <summary>
/// Unit Tests — LoginHandler.Handle()
/// Code Module : AuthModule
/// Method      : LoginHandler.Handle()
/// Test Req    : Test login function with email and password
/// Total TCs   : 15 (UTC001–UTC015)
/// 
/// Note on BCrypt: LoginHandler calls BCrypt.Net.BCrypt.Verify() directly (no interface wrapper).
/// Tests create a real hash via BCrypt.HashPassword() in Arrange so Verify() runs correctly.
/// </summary>
public class LoginHandlerTests
{
    // ── Constants ─────────────────────────────────────────────────────────────
    private const string ValidPassword = "Password123!";
    private const string ValidEmail    = "owner@owrms.com";

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Build handler with mocked dependencies.</summary>
    private static (LoginHandler handler,
                    Mock<IUserRepository> userRepo,
                    Mock<IJwtService>     jwt)
        BuildHandler()
    {
        var userRepo = new Mock<IUserRepository>();
        var jwt      = new Mock<IJwtService>();
        var handler  = new LoginHandler(userRepo.Object, jwt.Object);
        return (handler, userRepo, jwt);
    }

    /// <summary>Create a UserRecord with a real BCrypt hash so Verify() works in handler.</summary>
    private static UserRecord MakeUser(
        int    userId  = 1,
        string email   = ValidEmail,
        string? phone  = null,
        string status  = "ACTIVE",
        string role    = "RENTER",
        string password = ValidPassword)
    {
        string hash = BCrypt.Net.BCrypt.HashPassword(password);
        return new UserRecord(userId, "Dang Nhan Hai", email, hash, phone,
                              null, status, role, DateTime.UtcNow);
    }

    /// <summary>Setup jwt.GenerateToken to return a dummy token.</summary>
    private static void SetupJwt(Mock<IJwtService> jwt, string token = "jwt-token")
        => jwt.Setup(x => x.GenerateToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
              .Returns(token);

    // ── UTC001 — Normal: Valid email + correct password → LoginResult returned ─
    [Fact]
    public async Task UTC001_ValidEmail_CorrectPassword_ReturnsLoginResult()
    {
        // Arrange
        var (handler, userRepo, jwt) = BuildHandler();
        var user = MakeUser();

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
        userRepo.Setup(x => x.UpdateLastLoginAsync(1, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        SetupJwt(jwt, "jwt-token-001");

        var cmd = new LoginCommand(ValidEmail, ValidPassword);

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.NotNull(result);                         // Return = T → LoginResult not null
        Assert.Equal(1, result.UserId);
        Assert.Equal("jwt-token-001", result.Token);    // Token was generated
        jwt.Verify(x => x.GenerateToken(1, ValidEmail, "RENTER"), Times.Once);
    }

    // ── UTC002 — Abnormal: Email not found in system → UnauthorizedAccessException ─
    [Fact]
    public async Task UTC002_WrongEmail_UserNotFound_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync("wrong@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);

        var cmd = new LoginCommand("wrong@test.com", ValidPassword);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email/SĐT hoặc mật khẩu không đúng", ex.Message);
    }

    // ── UTC003 — Abnormal: Email with wrong domain, not in system ────────────
    [Fact]
    public async Task UTC003_EmailWrongDomain_UserNotFound_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();

        // "owner@test.com" is not in the system (only "owner@owrms.com" exists)
        userRepo.Setup(x => x.GetByEmailOrPhoneAsync("owner@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);

        var cmd = new LoginCommand("owner@test.com", ValidPassword);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email/SĐT hoặc mật khẩu không đúng", ex.Message);
    }

    // ── UTC004 — Abnormal: Account is SUSPENDED → UnauthorizedAccessException ─
    [Fact]
    public async Task UTC004_AccountSuspended_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();
        var user = MakeUser(email: "locked@test.com", status: "SUSPENDED");

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync("locked@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

        var cmd = new LoginCommand("locked@test.com", ValidPassword);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Tài khoản của bạn đã bị khóa", ex.Message);
    }

    // ── UTC005 — Abnormal: Account is DELETED → UnauthorizedAccessException ──
    [Fact]
    public async Task UTC005_AccountDeleted_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();
        var user = MakeUser(email: "del@test.com", status: "DELETED");

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync("del@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

        var cmd = new LoginCommand("del@test.com", ValidPassword);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Tài khoản của bạn đã bị xóa", ex.Message);
    }

    // ── UTC006 — Abnormal: Correct email, wrong password → UnauthorizedAccessException ─
    [Fact]
    public async Task UTC006_CorrectEmail_WrongPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();
        // User exists with hash of "Password123!" but login attempt uses "WrongPassword!"
        var user = MakeUser(password: ValidPassword);

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

        var cmd = new LoginCommand(ValidEmail, "WrongPassword!");  // wrong password

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email hoặc mật khẩu không đúng", ex.Message);
    }

    // ── UTC007 — Normal: Valid phone number login → LoginResult returned ───────
    [Fact]
    public async Task UTC007_ValidPhone_CorrectPassword_ReturnsLoginResult()
    {
        // Arrange
        var (handler, userRepo, jwt) = BuildHandler();
        var user = MakeUser(email: ValidEmail, phone: "0901234567");

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync("0901234567", It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
        userRepo.Setup(x => x.UpdateLastLoginAsync(1, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        SetupJwt(jwt, "jwt-token-phone");

        var cmd = new LoginCommand("0901234567", ValidPassword);  // login with phone

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.NotNull(result);                         // Return = T → success
        Assert.Equal("jwt-token-phone", result.Token);
    }

    // ── UTC008 — Boundary: Empty email string → UnauthorizedAccessException ──
    [Fact]
    public async Task UTC008_EmptyEmail_UserNotFound_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync("", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);

        var cmd = new LoginCommand("", ValidPassword);  // empty email

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email/SĐT hoặc mật khẩu không đúng", ex.Message);
    }

    // ── UTC009 — Boundary: Password with incorrect capitalization → UnauthorizedAccessException ─
    [Fact]
    public async Task UTC009_CorrectEmail_LowercasePasswordFirstLetter_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();
        // User has hash of "Password123!" (capital P)
        var user = MakeUser(password: ValidPassword);

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

        // "password123!" (lowercase p) — BCrypt is case-sensitive → Verify() = false
        var cmd = new LoginCommand(ValidEmail, "password123!");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email hoặc mật khẩu không đúng", ex.Message);
    }

    // ── UTC010 — Boundary: Empty password → UnauthorizedAccessException ───────
    [Fact]
    public async Task UTC010_EmptyPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();
        var user = MakeUser();

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

        // BCrypt.Verify("", hash_of_Password123!) → false → UnauthorizedAccessException
        var cmd = new LoginCommand(ValidEmail, "");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email hoặc mật khẩu không đúng", ex.Message);
    }

    // ── UTC011 — Boundary: Valid email, UpdateLastLogin is called only on success ─
    [Fact]
    public async Task UTC011_FailedLogin_UpdateLastLoginNotCalled()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();
        var user = MakeUser(password: ValidPassword);

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

        var cmd = new LoginCommand(ValidEmail, "WrongPassword!");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));

        // UpdateLastLogin must NOT be called when login fails
        userRepo.Verify(x => x.UpdateLastLoginAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                        Times.Never);
    }

    // ── UTC012 — Boundary: Successful login calls UpdateLastLogin exactly once ─
    [Fact]
    public async Task UTC012_SuccessfulLogin_UpdateLastLoginCalledOnce()
    {
        // Arrange
        var (handler, userRepo, jwt) = BuildHandler();
        var user = MakeUser();

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
        userRepo.Setup(x => x.UpdateLastLoginAsync(1, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        SetupJwt(jwt);

        var cmd = new LoginCommand(ValidEmail, ValidPassword);

        // Act
        await handler.Handle(cmd, CancellationToken.None);

        // Assert: UpdateLastLogin called exactly once after successful auth
        userRepo.Verify(x => x.UpdateLastLoginAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC013 — Abnormal: Email with trailing underscore (malformed) → UnauthorizedAccessException ─
    [Fact]
    public async Task UTC013_MalformedEmail_TrailingUnderscore_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (handler, userRepo, _) = BuildHandler();

        // "testlogin@test.com_" — not found in the system
        userRepo.Setup(x => x.GetByEmailOrPhoneAsync("testlogin@test.com_", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);

        var cmd = new LoginCommand("testlogin@test.com_", ValidPassword);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email/SĐT hoặc mật khẩu không đúng", ex.Message);
    }

    // ── UTC014 — Boundary: LoginResult contains correct role from UserRecord ──
    [Fact]
    public async Task UTC014_ValidLogin_LoginResultContainsCorrectRole()
    {
        // Arrange
        var (handler, userRepo, jwt) = BuildHandler();
        var user = MakeUser(role: "RENTER");

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
        userRepo.Setup(x => x.UpdateLastLoginAsync(1, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        jwt.Setup(x => x.GenerateToken(1, ValidEmail, "RENTER")).Returns("token-renter");

        var cmd = new LoginCommand(ValidEmail, ValidPassword);

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert: role is propagated to LoginResult
        Assert.Equal("RENTER", result.Role);
        Assert.Equal("token-renter", result.Token);
    }

    // ── UTC015 — Boundary: LoginResult has null AvatarUrl when user has no avatar ─
    [Fact]
    public async Task UTC015_ValidLogin_NoAvatar_ReturnsLoginResultWithNullAvatarUrl()
    {
        // Arrange
        var (handler, userRepo, jwt) = BuildHandler();
        // AvatarUrl = null (field index 5 in UserRecord)
        var user = new UserRecord(
            UserId: 2, FullName: "No Avatar User", Email: ValidEmail,
            PasswordHash: BCrypt.Net.BCrypt.HashPassword(ValidPassword),
            Phone: null, AvatarUrl: null, Status: "ACTIVE",
            RoleName: "RENTER", CreatedAt: DateTime.UtcNow);

        userRepo.Setup(x => x.GetByEmailOrPhoneAsync(ValidEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
        userRepo.Setup(x => x.UpdateLastLoginAsync(2, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        SetupJwt(jwt, "token-null-avatar");

        var cmd = new LoginCommand(ValidEmail, ValidPassword);

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert: AvatarUrl is null in response when user has none
        Assert.NotNull(result);
        Assert.Null(result.AvatarUrl);
    }
}
