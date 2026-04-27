using Moq;
using WMS.Application.Features.RentalRequests.ApproveRentalRequest;
using WMS.Application.Features.RentalRequests.RejectRentalRequest;
using WMS.Domain.Exceptions;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;
using Xunit;
using FluentValidation;
using MediatR;

namespace WMS.UnitTests.RentalRequests;

/// <summary>
/// Unit Tests - ApproveRentalRequest
/// Code Module : RentalRequestModule
/// Method      : ApproveRentalRequest (covers both Approve and Reject logic as per test matrix)
/// Total TCs   : 10 (UTCID01-UTCID10)
/// </summary>
public class ApproveRentalRequestHandlerTests
{
    private readonly Mock<IRentalRequestRepository> _mockRentalRequestRepo;
    private readonly Mock<IRentalContractRepository> _mockContractRepo;
    private readonly Mock<IWarehouseRepository> _mockWarehouseRepo;
    private readonly Mock<INotificationRepository> _mockNotificationRepo;
    private readonly Mock<INotificationSender> _mockNotificationSender;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly Mock<IPdfService> _mockPdfService;

    private readonly ApproveRentalRequestHandler _approveHandler;
    private readonly RejectRentalRequestHandler _rejectHandler;
    private readonly ApproveRentalRequestValidator _approveValidator;
    private readonly RejectRentalRequestValidator _rejectValidator;

    public ApproveRentalRequestHandlerTests()
    {
        _mockRentalRequestRepo = new Mock<IRentalRequestRepository>();
        _mockContractRepo = new Mock<IRentalContractRepository>();
        _mockWarehouseRepo = new Mock<IWarehouseRepository>();
        _mockNotificationRepo = new Mock<INotificationRepository>();
        _mockNotificationSender = new Mock<INotificationSender>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockPdfService = new Mock<IPdfService>();

        _approveHandler = new ApproveRentalRequestHandler(
            _mockRentalRequestRepo.Object,
            _mockContractRepo.Object,
            _mockWarehouseRepo.Object,
            _mockNotificationRepo.Object,
            _mockNotificationSender.Object,
            _mockUserRepo.Object,
            _mockPdfService.Object);

        _rejectHandler = new RejectRentalRequestHandler(
            _mockRentalRequestRepo.Object,
            _mockWarehouseRepo.Object,
            _mockNotificationRepo.Object,
            _mockNotificationSender.Object);

        _approveValidator = new ApproveRentalRequestValidator();
        _rejectValidator = new RejectRentalRequestValidator();
    }

    [Fact]
    public async Task UTCID01_ValidId_Owner_Pending_EnoughArea_Approve_Success()
    {
        // Arrange
        var rentalRequest = new RentalRequest { RequestId = 1, WarehouseId = 5, Status = "PENDING", RequestedArea = 50 };
        var warehouse = new Warehouse { WarehouseId = 5, OwnerId = 99, AvailableArea = 100 };
        
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(rentalRequest);
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);
        _mockContractRepo.Setup(x => x.AddAsync(It.IsAny<RentalContract>())).ReturnsAsync(200);

        var cmd = new ApproveRentalRequestCommand { RequestId = 1, ReviewerId = 99, MonthlyPayment = 1000, StartDate = DateTime.Today, DurationMonths = 12 };

        // Act
        var result = await _approveHandler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal(200, result);
        Assert.Equal("APPROVED", rentalRequest.Status);
    }

    [Fact]
    public async Task UTCID02_ValidId_Owner_Pending_EnoughArea_Reject_Success()
    {
        // Arrange
        var rentalRequest = new RentalRequest { RequestId = 1, WarehouseId = 5, Status = "PENDING" };
        var warehouse = new Warehouse { WarehouseId = 5, OwnerId = 99 };
        
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(rentalRequest);
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new RejectRentalRequestCommand { RequestId = 1, ReviewerId = 99, RejectionReason = "Lý do từ chối" };

        // Act
        await _rejectHandler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal("REJECTED", rentalRequest.Status);
    }

    [Fact]
    public async Task UTCID03_InvalidId_ThrowsNotFoundException()
    {
        // Arrange
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(999)).ReturnsAsync((RentalRequest?)null);

        var cmd = new ApproveRentalRequestCommand { RequestId = 999, ReviewerId = 99 };

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _approveHandler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task UTCID04_NullId_Zero_ThrowsNotFoundException()
    {
        // Arrange
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(0)).ReturnsAsync((RentalRequest?)null);

        var cmd = new ApproveRentalRequestCommand { RequestId = 0, ReviewerId = 99 };

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _approveHandler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task UTCID05_NotOwner_ThrowsUnauthorizedException()
    {
        // Arrange
        var rentalRequest = new RentalRequest { RequestId = 1, WarehouseId = 5, Status = "PENDING" };
        var warehouse = new Warehouse { WarehouseId = 5, OwnerId = 99 }; // Owner is 99
        
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(rentalRequest);
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new ApproveRentalRequestCommand { RequestId = 1, ReviewerId = 88 }; // Reviewer is 88

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() => _approveHandler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task UTCID06_AlreadyApproved_ThrowsInvalidStateException()
    {
        // Arrange
        var rentalRequest = new RentalRequest { RequestId = 1, WarehouseId = 5, Status = "APPROVED" };
        var warehouse = new Warehouse { WarehouseId = 5, OwnerId = 99 };
        
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(rentalRequest);
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new ApproveRentalRequestCommand { RequestId = 1, ReviewerId = 99 };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidStateException>(() => _approveHandler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task UTCID07_AlreadyRejected_ThrowsInvalidStateException()
    {
        // Arrange
        var rentalRequest = new RentalRequest { RequestId = 1, WarehouseId = 5, Status = "REJECTED" };
        var warehouse = new Warehouse { WarehouseId = 5, OwnerId = 99 };
        
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(rentalRequest);
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new RejectRentalRequestCommand { RequestId = 1, ReviewerId = 99, RejectionReason = "Lý do" };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidStateException>(() => _rejectHandler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task UTCID08_NotEnoughArea_ThrowsNotEnoughAreaException()
    {
        // Arrange
        var rentalRequest = new RentalRequest { RequestId = 1, WarehouseId = 5, Status = "PENDING", RequestedArea = 150 };
        var warehouse = new Warehouse { WarehouseId = 5, OwnerId = 99, AvailableArea = 100 }; // Only 100 available
        
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(rentalRequest);
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new ApproveRentalRequestCommand { RequestId = 1, ReviewerId = 99, MonthlyPayment = 1000, StartDate = DateTime.Today, DurationMonths = 12 };

        // Act & Assert
        await Assert.ThrowsAsync<NotEnoughAreaException>(() => _approveHandler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public void UTCID09_Reject_NullReason_ValidatorFails()
    {
        // Arrange
        var cmd = new RejectRentalRequestCommand { RequestId = 1, ReviewerId = 99, RejectionReason = "" };

        // Act
        var result = _rejectValidator.Validate(cmd);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "RejectionReason");
    }

    [Fact]
    public async Task UTCID10_Reject_ReasonMaxLen_Success()
    {
        // Arrange
        var maxReason = new string('R', 500);
        var rentalRequest = new RentalRequest { RequestId = 1, WarehouseId = 5, Status = "PENDING" };
        var warehouse = new Warehouse { WarehouseId = 5, OwnerId = 99 };
        
        _mockRentalRequestRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(rentalRequest);
        _mockWarehouseRepo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(warehouse);

        var cmd = new RejectRentalRequestCommand { RequestId = 1, ReviewerId = 99, RejectionReason = maxReason };

        // Act
        await _rejectHandler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.Equal("REJECTED", rentalRequest.Status);
        Assert.Equal(maxReason, rentalRequest.RejectionReason);
    }
}
