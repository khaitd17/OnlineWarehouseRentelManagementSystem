using Moq;
using WMS.Application.Features.Ratings.CreateRating;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests.Ratings;

/// <summary>
/// Unit Tests — CreateRatingHandler.Handle()
/// Code Module : RatingModule
/// Method      : CreateRatingHandler.Handle()
/// Test Req    : Verify that a Renter can submit a warehouse rating after contract completion.
///               Validates star range (1–5), duplicate rating prevention per contract,
///               and proper persistence of the rating record.
/// Total TCs   : 10 (UTC001–UTC010)
/// </summary>
public class CreateRatingHandlerTests
{
    // ── Helper ─────────────────────────────────────────────────────────────────

    private static (CreateRatingHandler handler, Mock<IRatingRepository> repoMock)
    BuildHandler()
    {
        var repo    = new Mock<IRatingRepository>();
        var handler = new CreateRatingHandler(repo.Object);
        return (handler, repo);
    }

    /// <summary>Default valid command — can override fields per test.</summary>
    private static CreateRatingCommand ValidCmd(
        int star       = 3,
        int? contractId = 1,
        int warehouseId = 1,
        string? comment = "Clean, spacious") => new()
    {
        RenterId    = 10,
        WarehouseId = warehouseId,
        ContractId  = contractId,
        Star        = star,
        Comment     = comment,
    };

    // ── UTC001 — Normal: Star=3, valid ContractId, comment provided → RatingId > 0 ──
    [Fact]
    public async Task UTC001_Star3_ValidContract_WithComment_ReturnsPositiveRatingId()
    {
        // Arrange
        var (handler, repo) = BuildHandler();

        repo.Setup(x => x.GetByContractIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Rating?)null);                    // no duplicate
        repo.Setup(x => x.CreateAsync(It.IsAny<Rating>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(101);                              // new RatingId = 101

        var cmd = ValidCmd(star: 3, contractId: 1, comment: "Clean, spacious");

        // Act
        var ratingId = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.True(ratingId > 0);                           // Returns new RatingId (integer > 0)
        repo.Verify(x => x.CreateAsync(
            It.Is<Rating>(r =>
                r.Star      == 3 &&
                r.IsHidden  == false &&
                r.Comment   == "Clean, spacious" &&
                r.CreatedAt != default),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC002 — Boundary: Star = 1 (lower boundary), Comment provided → success ─
    [Fact]
    public async Task UTC002_Star1_LowerBoundary_NullComment_ReturnsRatingId()
    {
        // Arrange
        var (handler, repo) = BuildHandler();

        repo.Setup(x => x.GetByContractIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Rating?)null);
        repo.Setup(x => x.CreateAsync(It.IsAny<Rating>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(102);

        var cmd = ValidCmd(star: 1, contractId: 2, comment: "Needs improvement");

        // Act
        var ratingId = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.True(ratingId > 0);          // Rating created successfully at lower star boundary
        repo.Verify(x => x.CreateAsync(
            It.Is<Rating>(r => r.Star == 1 && r.IsHidden == false),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC003 — Boundary: Star = 5 (upper boundary), comment provided → success ─
    [Fact]
    public async Task UTC003_Star5_UpperBoundary_WithComment_ReturnsRatingId()
    {
        // Arrange
        var (handler, repo) = BuildHandler();

        repo.Setup(x => x.GetByContractIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Rating?)null);
        repo.Setup(x => x.CreateAsync(It.IsAny<Rating>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(103);

        var cmd = ValidCmd(star: 5, contractId: 3, comment: "Excellent!");

        // Act
        var ratingId = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.True(ratingId > 0);
        repo.Verify(x => x.CreateAsync(
            It.Is<Rating>(r => r.Star == 5),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC004 — Boundary: Star = 0 (below lower boundary) → ArgumentException ─
    [Fact]
    public async Task UTC004_Star0_BelowLowerBoundary_ThrowsArgumentException()
    {
        // Arrange
        var (handler, _) = BuildHandler();

        var cmd = ValidCmd(star: 0, contractId: null, comment: null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Số sao phải từ 1 đến 5", ex.Message);
    }

    // ── UTC005 — Abnormal: Star = 6 (above upper boundary) → ArgumentException ─
    [Fact]
    public async Task UTC005_Star6_AboveUpperBoundary_ThrowsArgumentException()
    {
        // Arrange
        var (handler, _) = BuildHandler();

        var cmd = ValidCmd(star: 6, contractId: null, comment: null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Số sao phải từ 1 đến 5", ex.Message);
    }

    // ── UTC006 — Abnormal: Star = -1 (negative) → ArgumentException ───────────
    [Fact]
    public async Task UTC006_StarNegative_ThrowsArgumentException()
    {
        // Arrange
        var (handler, _) = BuildHandler();

        var cmd = ValidCmd(star: -1, contractId: null, comment: null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Số sao phải từ 1 đến 5", ex.Message);
    }

    // ── UTC007 — Normal: Star=4, valid ContractId, comment provided → IsHidden=false ─
    [Fact]
    public async Task UTC007_Star4_ValidContract_NullComment_IsHiddenFalse_ReturnsRatingId()
    {
        // Arrange
        var (handler, repo) = BuildHandler();

        repo.Setup(x => x.GetByContractIdAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Rating?)null);
        repo.Setup(x => x.CreateAsync(It.IsAny<Rating>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(107);

        var cmd = ValidCmd(star: 4, contractId: 7, comment: "Good warehouse");

        // Act
        var ratingId = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.True(ratingId > 0);
        repo.Verify(x => x.CreateAsync(
            It.Is<Rating>(r => r.Star == 4 && r.IsHidden == false && r.Comment == "Good warehouse"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC008 — Abnormal: WarehouseId = 9999 (invalid) → exception propagated ─
    [Fact]
    public async Task UTC008_WarehouseNotFound_RepoThrows_ExceptionPropagated()
    {
        // Arrange
        var (handler, repo) = BuildHandler();

        // When repo.CreateAsync fails (FK violation for non-existent warehouseId)
        repo.Setup(x => x.GetByContractIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Rating?)null);
        repo.Setup(x => x.CreateAsync(It.IsAny<Rating>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Warehouse 9999 not found."));

        var cmd = ValidCmd(star: 3, contractId: null, warehouseId: 9999, comment: "Test comment");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("9999", ex.Message);
    }

    // ── UTC009 — Abnormal: Same ContractId submitted twice → InvalidOperationException ─
    [Fact]
    public async Task UTC009_DuplicateContractRating_ThrowsInvalidOperationException()
    {
        // Arrange
        var (handler, repo) = BuildHandler();

        // Contract 1 already rated
        repo.Setup(x => x.GetByContractIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Rating { RatingId = 50, ContractId = 1, Star = 4 });

        var cmd = ValidCmd(star: 5, contractId: 1, comment: "Another review");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Bạn đã đánh giá hợp đồng này rồi", ex.Message);
    }

    // ── UTC010 — Abnormal: Star=3, Comment="" (empty string) → handler throws ArgumentException ─
    [Fact]
    public async Task UTC010_EmptyComment_HandledGracefully_RatingCreated()
    {
        // Handler now validates that comment is required (non-empty).

        // Arrange
        var (handler, repo) = BuildHandler();

        var cmd = ValidCmd(star: 3, contractId: null, comment: "");  // empty string

        // Act & Assert — handler rejects empty comment
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("Vui lòng nhập nhận xét", ex.Message);
    }
}
