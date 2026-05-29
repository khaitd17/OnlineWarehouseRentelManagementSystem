using Moq;
using WMS.Application.Features.InventoryRequests.ApproveRequest;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests.InventoryRequests;

public class ApproveInventoryRequestHandlerTests
{
    private static InventoryRequest MakeRequest(string status) => new()
    {
        InvReqId = 100,
        WarehouseId = 1,
        RenterId = 5,
        Type = "OUTBOUND",
        Status = status,
        RequestCode = "OUT-20260529-0185",
        Warehouse = new Warehouse
        {
            WarehouseId = 1,
            Name = "Kho Ha Noi",
            Is24HoursAccess = true,
        },
        InventoryItems = new List<InventoryItem>
        {
            new() { ItemName = "Ipad", Quantity = 1, Unit = "cai" }
        },
    };

    private static (
        ApproveInventoryRequestHandler handler,
        Mock<IInventoryRequestRepository> repoMock,
        Mock<ITaskRepository> taskMock,
        Mock<IInventoryRequestStaffNotifier> staffNotifierMock)
    BuildHandler()
    {
        var repo = new Mock<IInventoryRequestRepository>();
        var taskRepo = new Mock<ITaskRepository>();
        var emailService = new Mock<IEmailService>();
        var staffNotifier = new Mock<IInventoryRequestStaffNotifier>();

        taskRepo.Setup(x => x.CompleteUnitTaskAsync(
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(),
                It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        emailService.Setup(x => x.SendInfo(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var handler = new ApproveInventoryRequestHandler(
            repo.Object,
            taskRepo.Object,
            emailService.Object,
            staffNotifier.Object);

        return (handler, repo, taskRepo, staffNotifier);
    }

    [Fact]
    public async Task PendingToConfirmed_NotifiesWarehouseStaffOnce()
    {
        // Arrange
        var (handler, repo, _, staffNotifier) = BuildHandler();
        var pending = MakeRequest("PENDING");
        var confirmed = MakeRequest("CONFIRMED");

        repo.SetupSequence(x => x.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pending)
            .ReturnsAsync(confirmed);
        repo.Setup(x => x.UpdateAsync(It.IsAny<InventoryRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new ApproveInventoryRequestCommand
        {
            Id = 100,
            ManagerId = 9,
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal("CONFIRMED", result.Status);
        staffNotifier.Verify(x => x.NotifyReadyForProcessingAsync(
            confirmed,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AlreadyConfirmed_DoesNotNotifyWarehouseStaffAgain()
    {
        // Arrange
        var (handler, repo, _, staffNotifier) = BuildHandler();
        var confirmed = MakeRequest("CONFIRMED");
        var updated = MakeRequest("CONFIRMED");

        repo.SetupSequence(x => x.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(confirmed)
            .ReturnsAsync(updated);
        repo.Setup(x => x.UpdateAsync(It.IsAny<InventoryRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new ApproveInventoryRequestCommand
        {
            Id = 100,
            ManagerId = 9,
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal("CONFIRMED", result.Status);
        staffNotifier.Verify(x => x.NotifyReadyForProcessingAsync(
            It.IsAny<InventoryRequest>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
