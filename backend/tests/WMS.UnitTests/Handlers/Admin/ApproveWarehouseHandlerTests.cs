using Moq;
using WMS.Application.Common;
using WMS.Application.Features.Admin.ApproveWarehouse;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using Xunit;

namespace WMS.UnitTests.Handlers.Admin;

/// <summary>
/// Unit Tests - ApproveWarehouse
/// Code Module : AdminModule
/// Method      : ApproveWarehouse
/// Total TCs   : 10 (UTCID01-UTCID10)
/// </summary>
public class ApproveWarehouseHandlerTests
{
    private readonly Mock<IWarehouseRepository> _mockRepo;
    private readonly ApproveWarehouseHandler _handler;
    private readonly ApproveWarehouseValidator _validator;

    public ApproveWarehouseHandlerTests()
    {
        _mockRepo = new Mock<IWarehouseRepository>();
        _handler = new ApproveWarehouseHandler(_mockRepo.Object);
        _validator = new ApproveWarehouseValidator();
    }

    #region Handler Logic Tests (UTCID01 - UTCID07)

    [Fact]
    public async Task UTCID01_ValidId_Pending_Approve_Success()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "PENDING" };
        _mockRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(warehouse);

        var cmd = new ApproveWarehouseCommand(1, true, "", 99);

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("APPROVED", warehouse.Status);
        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<Warehouse>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UTCID02_ValidId_Pending_Reject_WithReason_Success()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "PENDING" };
        _mockRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(warehouse);

        var cmd = new ApproveWarehouseCommand(1, false, "Lý do xyz", 99);

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("REJECTED", warehouse.Status);
        Assert.Equal("Lý do xyz", warehouse.RejectionReason);
    }

    [Fact]
    public async Task UTCID03_ValidId_Pending_Approve_WithReason_Success_IgnoresReason()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "PENDING" };
        _mockRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(warehouse);

        var cmd = new ApproveWarehouseCommand(1, true, "Có kèm lý do nhưng bỏ qua", 99);

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("APPROVED", warehouse.Status);
        Assert.Null(warehouse.RejectionReason);
    }

    [Fact]
    public async Task UTCID04_InvalidId_ReturnsError()
    {
        // Arrange
        _mockRepo.Setup(x => x.GetByIdAsync(999, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((Warehouse?)null);

        var cmd = new ApproveWarehouseCommand(999, true, "", 99);

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("Không tìm thấy kho", result.Message);
    }

    [Fact]
    public async Task UTCID05_NullId_Zero_ReturnsError()
    {
        // Arrange
        _mockRepo.Setup(x => x.GetByIdAsync(0, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((Warehouse?)null);

        var cmd = new ApproveWarehouseCommand(0, true, "", 99);

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("Không tìm thấy kho", result.Message);
    }

    [Fact]
    public async Task UTCID06_ValidId_AlreadyApproved_ReturnsError()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "APPROVED" };
        _mockRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(warehouse);

        var cmd = new ApproveWarehouseCommand(1, true, "", 99);

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("Chỉ có thể duyệt/từ chối kho ở trạng thái PENDING", result.Message);
    }

    [Fact]
    public async Task UTCID07_ValidId_AlreadyRejected_ReturnsError()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "REJECTED" };
        _mockRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(warehouse);

        var cmd = new ApproveWarehouseCommand(1, false, "Lý do", 99);

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("Chỉ có thể duyệt/từ chối kho ở trạng thái PENDING", result.Message);
    }

    #endregion

    #region Validator Tests (UTCID08 - UTCID10)

    [Fact]
    public void UTCID08_Reject_EmptyReason_ValidatorFails()
    {
        // Arrange
        var cmd = new ApproveWarehouseCommand(1, false, "", 99); // Reject but empty reason

        // Act
        var result = _validator.Validate(cmd);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "RejectionReason");
    }

    [Fact]
    public void UTCID09_Reject_ReasonLength500_ValidatorSuccess()
    {
        // Arrange
        var longReason = new string('A', 500);
        var cmd = new ApproveWarehouseCommand(1, false, longReason, 99);

        // Act
        var result = _validator.Validate(cmd);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void UTCID10_Reject_ReasonLengthOver500_ValidatorFails()
    {
        // Arrange
        var tooLongReason = new string('A', 501);
        var cmd = new ApproveWarehouseCommand(1, false, tooLongReason, 99);

        // Act
        var result = _validator.Validate(cmd);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "RejectionReason" && e.ErrorMessage.Contains("vượt quá 500 ký tự"));
    }

    #endregion
}
