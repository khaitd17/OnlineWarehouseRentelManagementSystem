using Moq;
using WMS.Application.Features.Warehouses.CreateWarehouse;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests.Warehouses;

/// <summary>
/// Unit Tests — CreateWarehouseHandler.Handle()
/// Code Module : CreateWarehouse
/// Method      : CreateWarehouseHandler.Handle()
/// Test Req    : Test warehouse creation with owner assignment and OPERATOR membership
/// Total TCs   : 15 (UTC001–UTC015)
///
/// Validation Note:
///   CreateWarehouseValidator (FluentValidation) runs via MediatR ValidationBehavior
///   pipeline — NOT inside the handler itself. Therefore:
///     • Name empty / longer than 200 chars → pipeline rejects (GAP in unit test)
///     • Address empty / longer than 500 chars → pipeline rejects (GAP)
///     • TotalArea ≤ 0 → pipeline rejects (GAP)
///   Handler only creates the Warehouse entity and assigns OPERATOR membership.
/// </summary>
public class CreateWarehouseHandlerTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Build handler with mocked repositories.</summary>
    private static (CreateWarehouseHandler handler,
                    Mock<IWarehouseRepository>       warehouseRepo,
                    Mock<IStaffMembershipRepository> membershipRepo)
        BuildHandler()
    {
        var warehouseRepo  = new Mock<IWarehouseRepository>();
        var membershipRepo = new Mock<IStaffMembershipRepository>();
        var handler = new CreateWarehouseHandler(warehouseRepo.Object, membershipRepo.Object);
        return (handler, warehouseRepo, membershipRepo);
    }

    /// <summary>Setup CreateAsync to return a given warehouseId.</summary>
    private static void SetupCreate(Mock<IWarehouseRepository> repo, int warehouseId)
        => repo.Setup(x => x.CreateAsync(It.IsAny<Warehouse>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync(warehouseId);

    /// <summary>Setup CreateMembershipAsync to succeed (returns membershipId = 1).</summary>
    private static void SetupMembership(Mock<IStaffMembershipRepository> repo)
        => repo.Setup(x => x.CreateMembershipAsync(
                    It.IsAny<CreateMembershipDto>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync(1);

    // ── UTC001 — Normal: Valid data → warehouseId returned, OPERATOR membership created ─
    [Fact]
    public async Task UTC001_ValidCommand_ReturnsWarehouseId_OperatorMembershipCreated()
    {
        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();
        SetupCreate(warehouseRepo, 100);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId    = 2,
            Name       = "New Warehouse",
            Address    = "Valid Address 123",
            TotalArea  = 1000,
            Status     = "PENDING",
        };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(100, result);  // Return = T → warehouseId = 100

        // Verify OPERATOR membership assigned automatically after creation
        membershipRepo.Verify(x => x.CreateMembershipAsync(
            It.Is<CreateMembershipDto>(d =>
                d.UserId      == 2       &&
                d.WarehouseId == 100     &&
                d.RoleCode    == "OPERATOR" &&
                d.IsAllSkill  == true),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC002 — Abnormal: OwnerId = 999 (unknown user) → handler gap ─────────
    [Fact]
    public async Task UTC002_InvalidOwnerId_HandlerPassesThrough_DocumentedAsGap()
    {
        // GAP: Handler does NOT validate whether OwnerId exists in the User table.
        //      In production, the DB foreign-key constraint or the controller layer
        //      ensures OwnerId references a real user. At handler level, OwnerId = 999
        //      is assigned as-is to Warehouse.OwnerId and sent to the repo.

        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();
        SetupCreate(warehouseRepo, 101);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 999,    // non-existent user id
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = "PENDING",
        };

        // Act — handler passes OwnerId = 999 to repo without throwing
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert: handler itself does not throw (gap: DB FK or controller validates)
        Assert.Equal(101, result);
    }

    // ── UTC003 — Boundary: TotalArea = 0 → Validator rejects (400 Bad Request equivalent) ─
    [Fact]
    public void UTC003_TotalAreaZero_ValidatorFails_WithBadRequestLikeMessage()
    {
        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 0,    // invalid: must be > 0
            Status    = "PENDING",
        };

        var validator = new CreateWarehouseValidator();
        var result = validator.Validate(cmd);

        Assert.False(result.IsValid); // Simulates Return F in spreadsheet
        Assert.Contains(result.Errors, e => e.PropertyName == "TotalArea" && e.ErrorMessage.Contains("greater than 0")); // Simulates Log Message
    }

    // ── UTC004 — Boundary: TotalArea = -100 → Validator rejects ─────────
    [Fact]
    public void UTC004_NegativeTotalArea_ValidatorFails_WithBadRequestLikeMessage()
    {
        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = -100, // invalid: must be > 0
            Status    = "PENDING",
        };

        var validator = new CreateWarehouseValidator();
        var result = validator.Validate(cmd);

        Assert.False(result.IsValid); 
        Assert.Contains(result.Errors, e => e.PropertyName == "TotalArea" && e.ErrorMessage.Contains("greater than 0"));
    }

    // ── UTC005 — Boundary: TotalArea = 0 (exact boundary per validator rule) ──
    [Fact]
    public void UTC005_TotalAreaExactZeroBoundary_ValidatorFails()
    {
        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 0,   
        };

        var validator = new CreateWarehouseValidator();
        var result = validator.Validate(cmd);

        Assert.False(result.IsValid); 
        Assert.Contains(result.Errors, e => e.PropertyName == "TotalArea");
    }

    // ── UTC006 — Boundary: Name = empty string → Validator rejects ───────
    [Fact]
    public void UTC006_EmptyName_ValidatorFails_WithBadRequestLikeMessage()
    {
        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "",   // empty
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = "PENDING",
        };

        var validator = new CreateWarehouseValidator();
        var result = validator.Validate(cmd);

        Assert.False(result.IsValid); 
        Assert.Contains(result.Errors, e => e.PropertyName == "Name" && e.ErrorCode == "NotEmptyValidator");
    }

    // ── UTC007 — Boundary: Address = empty string → Validator rejects ────
    [Fact]
    public void UTC007_EmptyAddress_ValidatorFails_WithBadRequestLikeMessage()
    {
        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "",   // empty
            TotalArea = 1000,
            Status    = "PENDING",
        };

        var validator = new CreateWarehouseValidator();
        var result = validator.Validate(cmd);

        Assert.False(result.IsValid); 
        Assert.Contains(result.Errors, e => e.PropertyName == "Address" && e.ErrorCode == "NotEmptyValidator");
    }

    // ── UTC008 — Normal: Status = null → handler defaults to "HIDDEN" ─────────
    [Fact]
    public async Task UTC008_NullStatus_Handler_DefaultsStatusToHidden()
    {
        // Handler logic: Status = request.Status ?? "HIDDEN"
        // When Status is null, warehouse is created with Status = "HIDDEN".

        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();

        Warehouse? capturedWarehouse = null;
        warehouseRepo.Setup(x => x.CreateAsync(It.IsAny<Warehouse>(), It.IsAny<CancellationToken>()))
                     .Callback<Warehouse, CancellationToken>((wh, _) => capturedWarehouse = wh)
                     .ReturnsAsync(107);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = null,   // null → should default to "HIDDEN"
        };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(107, result);
        Assert.NotNull(capturedWarehouse);
        Assert.Equal("HIDDEN", capturedWarehouse!.Status);  // default applied
    }

    // ── UTC009 — Boundary: Status = "INVALID_STATUS" → handler passes through (GAP) ─
    [Fact]
    public async Task UTC009_InvalidStatus_HandlerPassesThrough_DocumentedAsGap()
    {
        // GAP: Status enum validation is not done in handler.
        //      "INVALID_STATUS" is assigned directly to Warehouse.Status.
        //      DB or pipeline should reject invalid status values.

        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();

        Warehouse? capturedWarehouse = null;
        warehouseRepo.Setup(x => x.CreateAsync(It.IsAny<Warehouse>(), It.IsAny<CancellationToken>()))
                     .Callback<Warehouse, CancellationToken>((wh, _) => capturedWarehouse = wh)
                     .ReturnsAsync(108);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = "INVALID_STATUS",
        };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert: handler does not throw (gap)
        Assert.Equal(108, result);
        Assert.Equal("INVALID_STATUS", capturedWarehouse!.Status);  // passed through as-is
    }

    // ── UTC010 — Boundary: Name longer than 200 characters → Validator rejects ─
    [Fact]
    public void UTC010_NameLongerThan200Chars_ValidatorFails_WithBadRequestLikeMessage()
    {
        string longName = new string('W', 201);  // 201 chars

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = longName,
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = "PENDING",
        };

        var validator = new CreateWarehouseValidator();
        var result = validator.Validate(cmd);

        Assert.False(result.IsValid); 
        Assert.Contains(result.Errors, e => e.PropertyName == "Name" && e.ErrorCode == "MaximumLengthValidator");
    }

    // ── UTC011 — Boundary: Address longer than 500 characters → Validator rejects ─
    [Fact]
    public void UTC011_AddressLongerThan500Chars_ValidatorFails_WithBadRequestLikeMessage()
    {
        string longAddress = new string('A', 501);  // 501 chars

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = longAddress,
            TotalArea = 1000,
            Status    = "PENDING",
        };

        var validator = new CreateWarehouseValidator();
        var result = validator.Validate(cmd);

        Assert.False(result.IsValid); 
        Assert.Contains(result.Errors, e => e.PropertyName == "Address" && e.ErrorCode == "MaximumLengthValidator");
    }

    // ── UTC012 — Boundary: OwnerId = 0 → handler gap (no validation on OwnerId) ─
    [Fact]
    public async Task UTC012_OwnerIdZero_HandlerPassesThrough_DocumentedAsGap()
    {
        // GAP: Handler does not validate OwnerId > 0. OwnerId = 0 is passed to repo.
        //      DB FK constraint would fail; handler itself does not throw.

        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();
        SetupCreate(warehouseRepo, 111);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 0,   // invalid
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = "PENDING",
        };

        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(111, result);  // gap: handler allows OwnerId = 0
    }

    // ── UTC013 — Boundary: Status string > 20 chars → handler passes (GAP) ───
    [Fact]
    public async Task UTC013_VeryLongStatus_HandlerPassesThrough_DocumentedAsGap()
    {
        // GAP: No length validation on Status in handler.
        //      DB column length constraint would reject this at persist time.

        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();
        string longStatus = "CHUOI_STATUS_QUADAIII_RATLONGVALUE";  // > 20 chars

        SetupCreate(warehouseRepo, 112);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = longStatus,
        };

        var result = await handler.Handle(cmd, CancellationToken.None);
        Assert.Equal(112, result);  // gap: DB would reject long status
    }

    // ── UTC014 — Normal: AvailableArea is automatically set to TotalArea ───────
    [Fact]
    public async Task UTC014_ValidCommand_AvailableAreaSetToTotalArea()
    {
        // Handler: AvailableArea = request.TotalArea (initial state, no zones yet)
        // This verifies the correct entity mapping.

        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();

        Warehouse? capturedWarehouse = null;
        warehouseRepo.Setup(x => x.CreateAsync(It.IsAny<Warehouse>(), It.IsAny<CancellationToken>()))
                     .Callback<Warehouse, CancellationToken>((wh, _) => capturedWarehouse = wh)
                     .ReturnsAsync(113);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId   = 2,
            Name      = "New Warehouse",
            Address   = "Valid Address 123",
            TotalArea = 1000,
            Status    = "PENDING",
        };

        // Act
        await handler.Handle(cmd, CancellationToken.None);

        // Assert: AvailableArea == TotalArea on creation
        Assert.NotNull(capturedWarehouse);
        Assert.Equal(1000, capturedWarehouse!.TotalArea);
        Assert.Equal(1000, capturedWarehouse!.AvailableArea);  // must match TotalArea initially
    }

    // ── UTC015 — Normal: Full valid command → warehouseId returned, both repos called ─
    [Fact]
    public async Task UTC015_FullValidCommand_BothRepositoriesCalledCorrectly()
    {
        // Verifies the complete creation flow:
        // 1. CreateAsync on warehouseRepo → returns warehouseId
        // 2. CreateMembershipAsync on membershipRepo → assigns OPERATOR to owner

        // Arrange
        var (handler, warehouseRepo, membershipRepo) = BuildHandler();
        SetupCreate(warehouseRepo, 200);
        SetupMembership(membershipRepo);

        var cmd = new CreateWarehouseCommand
        {
            OwnerId          = 2,
            Name             = "New Warehouse",
            Address          = "Valid Address 123",
            TotalArea        = 1000,
            Width            = 20,
            Length           = 50,
            Status           = "PENDING",
            Is24HoursAccess  = true,
            PricePerM2       = 50000,
        };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(200, result);

        // Warehouse created exactly once
        warehouseRepo.Verify(x => x.CreateAsync(
            It.Is<Warehouse>(w =>
                w.OwnerId   == 2        &&
                w.Name      == "New Warehouse" &&
                w.TotalArea == 1000),
            It.IsAny<CancellationToken>()), Times.Once);

        // OPERATOR membership created for the warehouse owner
        membershipRepo.Verify(x => x.CreateMembershipAsync(
            It.Is<CreateMembershipDto>(d =>
                d.UserId      == 2       &&
                d.WarehouseId == 200     &&
                d.RoleCode    == "OPERATOR"),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
