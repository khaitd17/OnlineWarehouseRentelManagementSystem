using Moq;
using WMS.Application.Features.RentalRequests.CreateRentalRequest;
using WMS.Domain.Exceptions;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;
using Xunit;
using FluentValidation;

namespace WMS.UnitTests.RentalRequests;

/// <summary>
/// Unit Tests - CreateRentalRequest
/// Code Module : RentalRequestModule
/// Method      : CreateRentalRequest
/// Total TCs   : 10 (UTCID01-UTCID10)
/// </summary>
public class CreateRentalRequestHandlerTests
{
    private readonly Mock<IRentalRequestRepository> _mockRentalRequestRepo;
    private readonly Mock<IWarehouseRepository> _mockWarehouseRepo;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly Mock<INotificationRepository> _mockNotificationRepo;
    private readonly Mock<INotificationSender> _mockNotificationSender;
    private readonly Mock<IEquipmentRepository> _mockEquipmentRepo;
    private readonly CreateRentalRequestHandler _handler;
    private readonly CreateRentalRequestValidator _validator;

    public CreateRentalRequestHandlerTests()
    {
        _mockRentalRequestRepo = new Mock<IRentalRequestRepository>();
        _mockWarehouseRepo = new Mock<IWarehouseRepository>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockNotificationRepo = new Mock<INotificationRepository>();
        _mockNotificationSender = new Mock<INotificationSender>();
        _mockEquipmentRepo = new Mock<IEquipmentRepository>();

        _handler = new CreateRentalRequestHandler(
            _mockRentalRequestRepo.Object,
            _mockWarehouseRepo.Object,
            _mockUserRepo.Object,
            _mockNotificationRepo.Object,
            _mockNotificationSender.Object,
            _mockEquipmentRepo.Object);

        _validator = new CreateRentalRequestValidator();
    }

    #region Handler Logic Tests (UTCID01 - UTCID05, UTCID10)

    [Fact]
    public async Task UTCID01_ValidData_Success()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "APPROVED", AvailableArea = 100, Name = "Kho A", OwnerId = 99 };
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);
        _mockRentalRequestRepo.Setup(x => x.HasPendingRequestAsync(1, 1)).ReturnsAsync(false);
        _mockRentalRequestRepo.Setup(x => x.AddAsync(It.IsAny<RentalRequest>())).ReturnsAsync(100);

        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 50, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(100, result);
        _mockRentalRequestRepo.Verify(x => x.AddAsync(It.IsAny<RentalRequest>()), Times.Once);
    }

    [Fact]
    public async Task UTCID02_RequestedAreaEqualsAvailable_Success()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "APPROVED", AvailableArea = 100, Name = "Kho A", OwnerId = 99 };
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);
        _mockRentalRequestRepo.Setup(x => x.HasPendingRequestAsync(1, 1)).ReturnsAsync(false);
        _mockRentalRequestRepo.Setup(x => x.AddAsync(It.IsAny<RentalRequest>())).ReturnsAsync(101);

        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 100, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(101, result);
    }

    [Fact]
    public async Task UTCID03_HasRejectedRequest_StillAllowsNewRequest_Success()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "APPROVED", AvailableArea = 100, Name = "Kho A", OwnerId = 99 };
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);
        _mockRentalRequestRepo.Setup(x => x.HasPendingRequestAsync(1, 1)).ReturnsAsync(false); // Has rejected, but no PENDING
        _mockRentalRequestRepo.Setup(x => x.AddAsync(It.IsAny<RentalRequest>())).ReturnsAsync(102);

        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 50, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };

        // Act
        var result = await _handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(102, result);
    }

    [Fact]
    public async Task UTCID04_WarehousePending_ThrowsInvalidWarehouseStateException()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "PENDING", AvailableArea = 100 };
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 50, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidWarehouseStateException>(() => _handler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task UTCID05_NotEnoughArea_ThrowsNotEnoughAreaException()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "APPROVED", AvailableArea = 100 };
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 150, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };

        // Act & Assert
        await Assert.ThrowsAsync<NotEnoughAreaException>(() => _handler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task UTCID10_HasPendingRequest_ThrowsDuplicateRequestException()
    {
        // Arrange
        var warehouse = new Warehouse { WarehouseId = 1, Status = "APPROVED", AvailableArea = 100 };
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);
        _mockRentalRequestRepo.Setup(x => x.HasPendingRequestAsync(1, 1)).ReturnsAsync(true);

        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 50, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };

        // Act & Assert
        await Assert.ThrowsAsync<DuplicateRequestException>(() => _handler.Handle(cmd, CancellationToken.None));
    }

    #endregion

    #region Validator Tests (UTCID06 - UTCID09)

    [Fact]
    public void UTCID06_RequestedAreaZero_ValidatorFails()
    {
        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 0, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };
        var result = _validator.Validate(cmd);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "RequestedArea");
    }

    [Fact]
    public void UTCID07_RequestedAreaNegative_ValidatorFails()
    {
        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = -1, StartDate = DateTime.Today.AddDays(1), DurationMonths = 6 };
        var result = _validator.Validate(cmd);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "RequestedArea");
    }

    [Fact]
    public void UTCID08_StartDateInPast_ValidatorFails()
    {
        // Image says StartDate > EndDate, but we use Duration. Past date is a common validation error.
        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 50, StartDate = DateTime.Today.AddDays(-1), DurationMonths = 6 };
        var result = _validator.Validate(cmd);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "StartDate");
    }

    [Fact]
    public void UTCID09_MissingStartDate_ValidatorFails()
    {
        var cmd = new CreateRentalRequestCommand { RenterId = 1, WarehouseId = 1, RequestedArea = 50, DurationMonths = 6 }; // StartDate is default(DateTime)
        var result = _validator.Validate(cmd);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "StartDate");
    }

    #endregion
}
