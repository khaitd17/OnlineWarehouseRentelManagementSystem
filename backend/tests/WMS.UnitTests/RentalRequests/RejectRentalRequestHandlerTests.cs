using MediatR;
using Moq;
using WMS.Application.Features.RentalRequests.RejectRentalRequest;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests.RentalRequests;


public class RejectRentalRequestHandlerTests
{
    // ─── Mocks ───────────────────────────────────────────────────────────────
    private readonly Mock<IRentalRequestRepository> _rentalRequestRepoMock;
    private readonly Mock<IWarehouseRepository>     _warehouseRepoMock;
    private readonly Mock<INotificationRepository>  _notificationRepoMock;
    private readonly Mock<INotificationSender>      _notificationSenderMock;
    private readonly RejectRentalRequestHandler     _handler;

    public RejectRentalRequestHandlerTests()
    {
        _rentalRequestRepoMock  = new Mock<IRentalRequestRepository>();
        _warehouseRepoMock      = new Mock<IWarehouseRepository>();
        _notificationRepoMock   = new Mock<INotificationRepository>();
        _notificationSenderMock = new Mock<INotificationSender>();

        _handler = new RejectRentalRequestHandler(
            _rentalRequestRepoMock.Object,
            _warehouseRepoMock.Object,
            _notificationRepoMock.Object,
            _notificationSenderMock.Object);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /// <summary>Tạo một RentalRequest PENDING hợp lệ.</summary>
    private static RentalRequest BuildPendingRequest(
        int requestId   = 1,
        int renterId    = 10,
        int warehouseId = 5)
        => new()
        {
            RequestId   = requestId,
            RenterId    = renterId,
            WarehouseId = warehouseId,
            Status      = "PENDING"
        };

    /// <summary>Tạo một Warehouse hợp lệ với OwnerId chỉ định.</summary>
    private static Warehouse BuildWarehouse(
        int warehouseId = 5,
        int ownerId     = 99,
        string name     = "Kho A")
        => new()
        {
            WarehouseId = warehouseId,
            OwnerId     = ownerId,
            Name        = name,
            Address     = "123 Đường ABC"
        };

    /// <summary>Tạo Command reject hợp lệ.</summary>
    private static RejectRentalRequestCommand BuildCommand(
        int requestId   = 1,
        int reviewerId  = 99,
        string reason   = "Không đủ điều kiện")
        => new()
        {
            RequestId       = requestId,
            ReviewerId      = reviewerId,
            RejectionReason = reason
        };

    // UTCID01 – (A) RentalRequest không tồn tại → InvalidOperationException
    
    [Fact]
    public async Task Handle_RequestNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        _rentalRequestRepoMock
            .Setup(r => r.GetByIdAsync(It.IsAny<int>()))
            .ReturnsAsync((RentalRequest?)null);

        var command = BuildCommand();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.Handle(command, CancellationToken.None));

        Assert.Equal("Rental request not found", ex.Message);

        // Warehouse không được gọi khi request đã null
        _warehouseRepoMock.Verify(
            w => w.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // UTCID02 – (N) Warehouse không tồn tại → InvalidOperationException
    
    [Fact]
    public async Task Handle_WarehouseNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var rentalRequest = BuildPendingRequest();

        _rentalRequestRepoMock
            .Setup(r => r.GetByIdAsync(rentalRequest.RequestId))
            .ReturnsAsync(rentalRequest);

        _warehouseRepoMock
            .Setup(w => w.GetByIdAsync(rentalRequest.WarehouseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Warehouse?)null);

        var command = BuildCommand(requestId: rentalRequest.RequestId);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.Handle(command, CancellationToken.None));

        Assert.Equal("Warehouse not found", ex.Message);
    }

    // UTCID03 – (B) ReviewerId ≠ OwnerId → UnauthorizedAccessException
   
    [Fact]
    public async Task Handle_ReviewerIsNotOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        const int ownerId    = 99;
        const int reviewerId = 88; // ≠ ownerId

        var rentalRequest = BuildPendingRequest();
        var warehouse     = BuildWarehouse(ownerId: ownerId);

        _rentalRequestRepoMock
            .Setup(r => r.GetByIdAsync(rentalRequest.RequestId))
            .ReturnsAsync(rentalRequest);

        _warehouseRepoMock
            .Setup(w => w.GetByIdAsync(rentalRequest.WarehouseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);

        var command = BuildCommand(reviewerId: reviewerId);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _handler.Handle(command, CancellationToken.None));

        Assert.Equal("Only warehouse owner can reject requests", ex.Message);
    }

    // UTCID04 – (N) Happy path: từ chối thành công, gửi notification cho Renter
   
    [Fact]
    public async Task Handle_ValidReject_ReturnsUnit_AndUpdatesStatus_AndSendsNotificationToRenter()
    {
        // Arrange
        const int ownerId     = 99;
        const int renterId    = 10;
        const int warehouseId = 5;

        var rentalRequest = BuildPendingRequest(renterId: renterId, warehouseId: warehouseId);
        var warehouse     = BuildWarehouse(warehouseId: warehouseId, ownerId: ownerId);

        _rentalRequestRepoMock
            .Setup(r => r.GetByIdAsync(rentalRequest.RequestId))
            .ReturnsAsync(rentalRequest);

        _warehouseRepoMock
            .Setup(w => w.GetByIdAsync(warehouseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);

        _rentalRequestRepoMock
            .Setup(r => r.UpdateAsync(It.IsAny<RentalRequest>()))
            .Returns(Task.CompletedTask);

        _notificationRepoMock
            .Setup(n => n.AddAsync(It.IsAny<Notification>()))
            .ReturnsAsync(1); // INotificationRepository.AddAsync trả về Task<int>

        _notificationSenderMock
            .Setup(s => s.SendToUserAsync(It.IsAny<int>(), It.IsAny<Notification>()))
            .Returns(Task.CompletedTask);

        var command = BuildCommand(reviewerId: ownerId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert 1 – trả về Unit.Value (theo Excel: Return = Unit.Value)
        Assert.Equal(Unit.Value, result);

        // Assert 2 – trạng thái request đã chuyển sang REJECTED (domain method hoạt động đúng)
        Assert.Equal("REJECTED", rentalRequest.Status);

        // Assert 3 – UpdateAsync gọi đúng 1 lần
        _rentalRequestRepoMock.Verify(
            r => r.UpdateAsync(It.Is<RentalRequest>(req => req.Status == "REJECTED")),
            Times.Once);

        // Assert 4 – NotificationRepository.AddAsync gọi với UserId = RenterId
        //            (theo Excel row 28: NotificationRepository.AddAsync called with UserId = RenterId)
        _notificationRepoMock.Verify(
            n => n.AddAsync(It.Is<Notification>(notif => notif.UserId == renterId)),
            Times.Once);

        // Assert 5 – NotificationSender.SendToUserAsync gọi với RenterId
        //            (theo Excel row 29: NotificationSender.SendToUserAsync called with RenterId)
        _notificationSenderMock.Verify(
            s => s.SendToUserAsync(
                renterId,
                It.IsAny<Notification>()),
            Times.Once);
    }
}
