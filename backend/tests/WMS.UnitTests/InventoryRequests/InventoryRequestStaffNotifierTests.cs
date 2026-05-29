using Microsoft.Extensions.Logging;
using Moq;
using System.Net;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests.InventoryRequests;

public class InventoryRequestStaffNotifierTests
{
    private static InventoryRequest ReadyRequest() => new()
    {
        InvReqId = 1079,
        WarehouseId = 1,
        RenterId = 5,
        Type = "OUTBOUND",
        Status = "CONFIRMED",
        RequestCode = "OUT-20260529-0185",
        ScheduledDate = new DateTime(2026, 5, 30),
        CreatedAt = new DateTime(2026, 5, 29, 8, 0, 0),
        Notes = "Người thuê: Lấy hàng buổi sáng",
        Warehouse = new Warehouse
        {
            WarehouseId = 1,
            Name = "Kho Hà Nội",
            Is24HoursAccess = true,
        },
        Renter = new User
        {
            UserId = 5,
            FullName = "Nguyễn Xuân Hòa",
            Email = "renter@example.com",
            Phone = "0900000000",
        },
        InventoryItems = new List<InventoryItem>
        {
            new() { ItemName = "Ipad", Quantity = 1, Unit = "cái" }
        },
    };

    private static InventoryRequestStaffNotifier BuildNotifier(
        Mock<IStaffMembershipRepository> membershipRepo,
        Mock<IEmailService> emailService)
    {
        var logger = new Mock<ILogger<InventoryRequestStaffNotifier>>();
        return new InventoryRequestStaffNotifier(
            membershipRepo.Object,
            emailService.Object,
            logger.Object);
    }

    [Fact]
    public async Task ConfirmedRequest_SendsEmailToFirstRecipientOnly()
    {
        // Arrange
        var membershipRepo = new Mock<IStaffMembershipRepository>();
        var emailService = new Mock<IEmailService>();
        var request = ReadyRequest();

        membershipRepo.Setup(x => x.GetActiveWarehouseNotificationRecipientsAsync(
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<WarehouseNotificationRecipientDto>
            {
                new() { UserId = 10, FullName = "Phan Hoàng Bảo", Email = "Phanhoangbao59@gmail.com", RoleCode = "STAFF" },
                new() { UserId = 11, FullName = "Quản lý kho", Email = "manager@example.com", RoleCode = "MANAGER" },
            });
        emailService.Setup(x => x.SendInfo(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var notifier = BuildNotifier(membershipRepo, emailService);

        // Act
        await notifier.NotifyReadyForProcessingAsync(request, CancellationToken.None);

        // Assert
        emailService.Verify(x => x.SendInfo(
            "Phanhoangbao59@gmail.com",
            It.IsAny<string>(),
            It.Is<string>(subject =>
                subject.Contains("Yêu cầu xuất kho") &&
                subject.Contains("OUT-20260529-0185") &&
                subject.Contains("Kho Hà Nội")),
            It.Is<string>(body =>
                body.Contains("#1079 - OUT-20260529-0185") &&
                body.Contains("Thông tin yêu cầu") &&
                body.Contains("30/05/2026") &&
                body.Contains(WebUtility.HtmlEncode("Nguyễn Xuân Hòa")) &&
                body.Contains("Ipad") &&
                body.Contains(WebUtility.HtmlEncode("cái")))), Times.Once);
        emailService.Verify(x => x.SendInfo(
            "manager@example.com",
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task PendingRequest_DoesNotQueryRecipientsOrSendEmail()
    {
        // Arrange
        var membershipRepo = new Mock<IStaffMembershipRepository>();
        var emailService = new Mock<IEmailService>();
        var request = ReadyRequest();
        request.Status = "PENDING";
        var notifier = BuildNotifier(membershipRepo, emailService);

        // Act
        await notifier.NotifyReadyForProcessingAsync(request, CancellationToken.None);

        // Assert
        membershipRepo.Verify(x => x.GetActiveWarehouseNotificationRecipientsAsync(
            It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
        emailService.Verify(x => x.SendInfo(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task EmailFailure_DoesNotThrow()
    {
        // Arrange
        var membershipRepo = new Mock<IStaffMembershipRepository>();
        var emailService = new Mock<IEmailService>();
        var request = ReadyRequest();

        membershipRepo.Setup(x => x.GetActiveWarehouseNotificationRecipientsAsync(
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<WarehouseNotificationRecipientDto>
            {
                new() { UserId = 10, FullName = "Phan Hoàng Bảo", Email = "Phanhoangbao59@gmail.com", RoleCode = "STAFF" },
            });
        emailService.Setup(x => x.SendInfo(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("smtp failed"));

        var notifier = BuildNotifier(membershipRepo, emailService);

        // Act
        var exception = await Record.ExceptionAsync(() =>
            notifier.NotifyReadyForProcessingAsync(request, CancellationToken.None));

        // Assert
        Assert.Null(exception);
    }
}
