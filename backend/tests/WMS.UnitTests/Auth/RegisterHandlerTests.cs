using Moq;
using WMS.Application.Features.Auth.Register;
using WMS.Application.Interfaces;

namespace WMS.UnitTests.Auth;

/// <summary>
/// Unit Tests — RegisterHandler.Handle()
/// Code Module : AuthModule
/// Method      : RegisterHandler.Handle()
/// Test Req    : Test register function with email and password
/// Total TCs   : 15 (UTC001–UTC015)
///
/// System Design Note:
///   Users always register as RENTER (default role). Later, they can upgrade
///   to OWNER by purchasing a subscription plan. Therefore, the valid RoleName
///   at registration time is "RENTER".
///
/// Validation Note:
///   RegisterHandler only validates email uniqueness. Format validation (email
///   format, password complexity, RoleName casing) runs via MediatR
///   ValidationBehavior pipeline — NOT inside the handler itself. Unit tests
///   that fall into this category are marked // GAP.
/// </summary>
public class RegisterHandlerTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Build handler with mocked IUserRepository.</summary>
    private static (RegisterHandler handler, Mock<IUserRepository> userRepo)
        BuildHandler()
    {
        var userRepo = new Mock<IUserRepository>();
        var handler  = new RegisterHandler(userRepo.Object);
        return (handler, userRepo);
    }

    /// <summary>A minimal existing UserRecord for simulating duplicate email.</summary>
    private static UserRecord ExistingUser(string email = "admin@test.com") =>
        new(1, "Admin", email, "hash", null, null, "ACTIVE", "RENTER", DateTime.UtcNow);

    // ── UTC001 — Normal: New email, valid password, RENTER, with phone → userId returned ─
    [Fact]
    public async Task UTC001_NewEmail_ValidData_Renter_WithPhone_ReturnsUserId()
    {
        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);   // email not yet exist
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(42);                  // DB returns new userId = 42

        var cmd = new RegisterCommand(
            FullName: "Nguyen Van A",
            Email:    "newuser@test.com",
            Password: "Password123!",
            Phone:    "901234567",
            RoleName: "RENTER");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(42, result);                   // Return = T → new userId
        // Verify CreateAsync was called with correct email & role
        userRepo.Verify(x => x.CreateAsync(
            It.Is<CreateUserDto>(d => d.Email == "newuser@test.com" && d.RoleName == "RENTER"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC002 — Abnormal: Email already exists → InvalidOperationException ──
    [Fact]
    public async Task UTC002_ExistingEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("admin@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync(ExistingUser("admin@test.com"));   // email already taken

        var cmd = new RegisterCommand("Existing", "admin@test.com", "Password123!", null, "RENTER");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Email này đã được sử dụng", ex.Message);

        // CreateAsync must NOT be called when email is duplicate
        userRepo.Verify(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()),
                        Times.Never);
    }

    // ── UTC003 — Boundary: RoleName = "" (empty) — handler passes through to repo (GAP) ─
    [Fact]
    public async Task UTC003_EmptyRoleName_HandlerPassesThrough_DocumentedAsValidationGap()
    {
        // GAP: RoleName validation (non-empty) is handled by FluentValidation pipeline.
        //      RegisterHandler itself does NOT check RoleName value.
        //      This test documents the current handler behavior: it calls CreateAsync
        //      with an empty RoleName without throwing. In production, the pipeline
        //      rejects this before the handler is reached.

        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(5);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "Password123!", null, "");

        // Act — handler does NOT throw; gap is at the pipeline level
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert: handler succeeded (gap — pipeline would have blocked this)
        Assert.Equal(5, result);
    }

    // ── UTC004 — Normal: Phone = null (optional field) → registration succeeds ─
    [Fact]
    public async Task UTC004_NullPhone_OptionalField_ReturnsUserId()
    {
        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(10);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "Password123!", null, "RENTER");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(10, result);
        userRepo.Verify(x => x.CreateAsync(
            It.Is<CreateUserDto>(d => d.Phone == null),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC005 — Boundary: RoleName = null → handler passes through (GAP) ─────
    [Fact]
    public async Task UTC005_NullRoleName_HandlerPassesThrough_DocumentedAsValidationGap()
    {
        // GAP: Same as UTC003. Null RoleName is caught by FluentValidation pipeline.
        //      RegisterHandler passes the null value directly to CreateAsync.

        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(6);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "Password123!", null, null!);

        // Act & Assert — handler passes through without throwing (gap)
        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(6, result);
    }

    // ── UTC006 — Boundary: Email = empty string → handler cannot find user, passes to repo (GAP) ─
    [Fact]
    public async Task UTC006_EmptyEmail_HandlerPassesThrough_DocumentedAsValidationGap()
    {
        // GAP: Empty email validation sits in the FluentValidation pipeline.
        //      Handler calls GetByEmailAsync("") → null (no user with empty email),
        //      then calls CreateAsync with empty email. In production, pipeline rejects this.

        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(7);

        var cmd = new RegisterCommand("New User", "", "Password123!", null, "RENTER");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert: handler succeeds (gap — pipeline would have blocked)
        Assert.Equal(7, result);
    }

    // ── UTC007 — Boundary: Email with SQL injection attempt → handler treats as string (GAP) ─
    [Fact]
    public async Task UTC007_SqlInjectionEmail_HandlerTreatsAsLiteralString()
    {
        // GAP: "OR 1=1 --" is not a valid email format; pipeline rejects it.
        //      In the handler, GetByEmailAsync receives the string as-is (repo is mocked).
        //      This test confirms the handler does not crash on the string value itself.

        // Arrange
        var (handler, userRepo) = BuildHandler();
        string injectionEmail = "OR 1=1 --";

        userRepo.Setup(x => x.GetByEmailAsync(injectionEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(8);

        var cmd = new RegisterCommand("Hacker", injectionEmail, "Password123!", null, "RENTER");

        // Act — pipeline would block this; handler passes through
        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(8, result);
    }

    // ── UTC008 — Abnormal: RoleName = "rEnTeR" (wrong casing) — handler gap ──
    [Fact]
    public async Task UTC008_WrongCaseRoleName_HandlerPassesThrough_DocumentedAsGap()
    {
        // GAP: System design → users register as RENTER (default role).
        //      "rEnTeR" (wrong casing) is invalid per business rules.
        //      Validation pipeline would reject this before the handler.
        //      RegisterHandler itself does NOT validate RoleName casing.
        //      If this reaches the DB, it would fail with a constraint violation.
        //      In this unit test, the repo mock accepts any value.

        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(9);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "Password123!", null, "rEnTeR");

        // Act — handler passes through (gap)
        var result = await handler.Handle(cmd, CancellationToken.None);
        // In production, pipeline rejects "rEnTeR" with "Role '...' không tồn tại..."
        Assert.Equal(9, result);  // gap: handler allows wrong casing through
    }

    // ── UTC009 — Boundary: Email with invalid format → handler treats as string (GAP) ─
    [Fact]
    public async Task UTC009_InvalidEmailFormat_HandlerPassesThrough_DocumentedAsValidationGap()
    {
        // GAP: "invalid_email_format" has no "@" — pipeline rejects, handler does not.

        // Arrange
        var (handler, userRepo) = BuildHandler();
        string badEmail = "invalid_email_format";

        userRepo.Setup(x => x.GetByEmailAsync(badEmail, It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(11);

        var cmd = new RegisterCommand("New User", badEmail, "Password123!", null, "RENTER");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(11, result);  // gap exposed
    }

    // ── UTC010 — Boundary: Empty password → BCrypt still runs, handler passes (GAP) ─
    [Fact]
    public async Task UTC010_EmptyPassword_HandlerHashesAndPasses_DocumentedAsValidationGap()
    {
        // GAP: Empty password validation is in the pipeline.
        //      BCrypt.Net.BCrypt.HashPassword("") succeeds (hash of empty string).
        //      RegisterHandler creates user with hash of empty string.
        //      This test documents the gap.

        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(12);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "", null, "RENTER");

        // Act — BCrypt.HashPassword("") does not throw; handler proceeds (gap)
        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(12, result);   // gap: pipeline would have blocked empty password
    }

    // ── UTC011 — Boundary: Password = "1" (too short) → handler passes (GAP) ─
    [Fact]
    public async Task UTC011_TooShortPassword_HandlerHashesAndPasses_DocumentedAsValidationGap()
    {
        // GAP: Password minimum length (e.g., 8 chars) enforced by pipeline, not handler.
        //      BCrypt.HashPassword("1") succeeds. Handler creates user successfully.

        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(13);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "1", null, "RENTER");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(13, result);   // gap: pipeline would reject password "1"
    }

    // ── UTC012 — Abnormal: RoleName = "BAD_ROLE" (invalid) → handler gap ──────
    [Fact]
    public async Task UTC012_InvalidRoleName_HandlerPassesThrough_DocumentedAsGap()
    {
        // GAP: "BAD_ROLE" is not a valid role in the system (only RENTER at registration).
        //      Pipeline validator rejects it; handler passes it to the repo as-is.
        //      In production, DB unique constraint on role table would cause failure.

        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(14);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "Password123!", null, "BAD_ROLE");

        // Act — handler allows "BAD_ROLE" through (gap)
        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(14, result);  // gap: pipeline rejects with "Role ... không tồn tại..."
    }

    // ── UTC013 — Normal: RENTER registration, Phone = null → success ─────────
    [Fact]
    public async Task UTC013_RenterRegistration_NullPhone_ReturnsUserId()
    {
        // Arrange
        var (handler, userRepo) = BuildHandler();

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(20);

        var cmd = new RegisterCommand("New Renter", "newuser@test.com", "Password123!", null, "RENTER");

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(20, result);
        // Password stored is BCrypt hash, not plain text
        userRepo.Verify(x => x.CreateAsync(
            It.Is<CreateUserDto>(d =>
                d.RoleName == "RENTER" &&
                d.Phone    == null     &&
                d.PasswordHash != "Password123!"),   // hash ≠ plain text
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC014 — Normal: Registration password is stored as BCrypt hash, not plaintext ─
    [Fact]
    public async Task UTC014_Registration_PasswordIsStoredAsHash_NotPlainText()
    {
        // Arrange
        var (handler, userRepo) = BuildHandler();
        string?     capturedHash = null;

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .Callback<CreateUserDto, CancellationToken>((dto, _) => capturedHash = dto.PasswordHash)
                .ReturnsAsync(21);

        var cmd = new RegisterCommand("New User", "newuser@test.com", "Password123!", null, "RENTER");

        // Act
        await handler.Handle(cmd, CancellationToken.None);

        // Assert: stored hash is a BCrypt hash, not the plain-text password
        Assert.NotNull(capturedHash);
        Assert.NotEqual("Password123!", capturedHash);                  // not plain text
        Assert.True(BCrypt.Net.BCrypt.Verify("Password123!", capturedHash!)); // valid bcrypt hash
    }

    // ── UTC015 — Boundary: FullName longer than 100 characters → handler passes (GAP) ─
    [Fact]
    public async Task UTC015_LongFullName_HandlerPassesThrough_DocumentedAsValidationGap()
    {
        // GAP: MaxLength constraint on FullName enforced by pipeline/DB, not in handler.
        //      RegisterHandler does not validate string length of FullName.

        // Arrange
        var (handler, userRepo) = BuildHandler();
        string longName = new string('A', 101); // 101 characters

        userRepo.Setup(x => x.GetByEmailAsync("newuser@test.com", It.IsAny<CancellationToken>()))
                .ReturnsAsync((UserRecord?)null);
        userRepo.Setup(x => x.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(99);

        var cmd = new RegisterCommand(longName, "newuser@test.com", "Password123!", null, "RENTER");

        // Act — handler does not throw for long FullName (gap)
        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(99, result);   // gap: pipeline or DB would reject 101-char name
    }
}
