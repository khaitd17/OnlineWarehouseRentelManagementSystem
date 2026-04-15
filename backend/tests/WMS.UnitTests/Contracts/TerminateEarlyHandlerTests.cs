using Moq;
using WMS.Application.Features.Contracts.TerminateEarly;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests.Contracts;

// Unit tests: TerminateEarlyHandler – 6 test cases (UTCID01–06)
public class TerminateEarlyHandlerTests
{
    private readonly Mock<IRentalContractRepository> _contractRepoMock;
    private readonly Mock<IWarehouseRepository>      _warehouseRepoMock;
    private readonly Mock<INotificationRepository>   _notificationRepoMock;
    private readonly Mock<INotificationSender>       _notificationSenderMock;
    private readonly TerminateEarlyHandler           _handler;

    public TerminateEarlyHandlerTests()
    {
        _contractRepoMock       = new Mock<IRentalContractRepository>();
        _warehouseRepoMock      = new Mock<IWarehouseRepository>();
        _notificationRepoMock   = new Mock<INotificationRepository>();
        _notificationSenderMock = new Mock<INotificationSender>();

        _handler = new TerminateEarlyHandler(
            _contractRepoMock.Object,
            _warehouseRepoMock.Object,
            _notificationRepoMock.Object,
            _notificationSenderMock.Object);
    }

    // Helpers – dùng reflection vì RentalContract có private constructor
    private static RentalContract BuildContract(
        int contractId = 1, int renterId = 10, int warehouseId = 5,
        string status = RentalContractStatus.Active, string contractNo = "RTC-2026-00001")
    {
        var c = (RentalContract)System.Runtime.CompilerServices.RuntimeHelpers
            .GetUninitializedObject(typeof(RentalContract));
        typeof(RentalContract).GetProperty(nameof(RentalContract.ContractId))!.SetValue(c, contractId);
        typeof(RentalContract).GetProperty(nameof(RentalContract.RenterId))!.SetValue(c, renterId);
        typeof(RentalContract).GetProperty(nameof(RentalContract.WarehouseId))!.SetValue(c, warehouseId);
        typeof(RentalContract).GetProperty(nameof(RentalContract.Status))!.SetValue(c, status);
        typeof(RentalContract).GetProperty(nameof(RentalContract.ContractNumber))!.SetValue(c, contractNo);
        typeof(RentalContract).GetProperty(nameof(RentalContract.IncludedEquipments))!.SetValue(c, new List<Equipment>());
        typeof(RentalContract).GetProperty(nameof(RentalContract.EquipmentUsageLogs))!.SetValue(c, new List<EquipmentHistory>());
        return c;
    }

    private static Warehouse BuildWarehouse(int warehouseId = 5, int ownerId = 99)
        => new() { WarehouseId = warehouseId, OwnerId = ownerId, Name = "Kho A", Address = "123" };

    private static TerminateEarlyCommand BuildCommand(int contractId = 1, int userId = 10, string reason = "Không còn nhu cầu")
        => new() { ContractId = contractId, UserId = userId, TerminationReason = reason };

    private void SetupContractAndWarehouse(RentalContract contract, Warehouse wh)
    {
        _contractRepoMock.Setup(r => r.GetByIdAsync(contract.ContractId)).ReturnsAsync(contract);
        _warehouseRepoMock.Setup(w => w.GetByIdAsync(contract.WarehouseId, It.IsAny<CancellationToken>())).ReturnsAsync(wh);
    }

    // UTCID01 – (A) Contract không tồn tại → Success=false, "Contract not found"
    [Fact]
    public async Task Handle_ContractNotFound_ReturnsFailure()
    {
        _contractRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((RentalContract?)null);

        var result = await _handler.Handle(BuildCommand(), CancellationToken.None);

        Assert.False(result.Success);
        Assert.Equal("Contract not found", result.Message);
        _warehouseRepoMock.Verify(w => w.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // UTCID02 – (A) Warehouse không tồn tại → Success=false, "Warehouse not found"
    [Fact]
    public async Task Handle_WarehouseNotFound_ReturnsFailure()
    {
        var contract = BuildContract();
        _contractRepoMock.Setup(r => r.GetByIdAsync(contract.ContractId)).ReturnsAsync(contract);
        _warehouseRepoMock.Setup(w => w.GetByIdAsync(contract.WarehouseId, It.IsAny<CancellationToken>())).ReturnsAsync((Warehouse?)null);

        var result = await _handler.Handle(BuildCommand(), CancellationToken.None);

        Assert.False(result.Success);
        Assert.Equal("Warehouse not found", result.Message);
    }

    // UTCID03 – (N) UserId không phải Renter cũng không phải Owner → unauthorized
    [Fact]
    public async Task Handle_UserNeitherRenterNorOwner_ReturnsUnauthorized()
    {
        var contract = BuildContract(renterId: 10);
        var wh       = BuildWarehouse(ownerId: 99);
        SetupContractAndWarehouse(contract, wh);

        var result = await _handler.Handle(BuildCommand(userId: 55), CancellationToken.None);

        Assert.False(result.Success);
        Assert.Equal("You are not authorized to terminate this contract", result.Message);
    }

    // UTCID04 – (N) Status ≠ ACTIVE → Cannot terminate
    [Fact]
    public async Task Handle_ContractNotActive_ReturnsFailure()
    {
        var contract = BuildContract(renterId: 10, status: "COMPLETED");
        var wh       = BuildWarehouse(ownerId: 99);
        SetupContractAndWarehouse(contract, wh);

        var result = await _handler.Handle(BuildCommand(userId: 10), CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("Cannot terminate contract with status", result.Message);
        Assert.Contains("COMPLETED", result.Message);
    }

    // UTCID05 – (N) Renter yêu cầu → Success=true, RequestTerminationAsync gọi "RENTER", notify Owner
    [Fact]
    public async Task Handle_RenterTerminates_ReturnsSuccess_AndNotifiesOwner()
    {
        const int renterId = 10, ownerId = 99;
        var contract = BuildContract(renterId: renterId);
        var wh       = BuildWarehouse(ownerId: ownerId);
        SetupContractAndWarehouse(contract, wh);
        _contractRepoMock.Setup(r => r.RequestTerminationAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<decimal?>())).Returns(Task.CompletedTask);
        _notificationRepoMock.Setup(n => n.AddAsync(It.IsAny<Notification>())).ReturnsAsync(1);
        _notificationSenderMock.Setup(s => s.SendToUserAsync(It.IsAny<int>(), It.IsAny<Notification>())).Returns(Task.CompletedTask);

        var result = await _handler.Handle(BuildCommand(userId: renterId), CancellationToken.None);

        Assert.True(result.Success);
        Assert.True(result.PendingApproval);
        _contractRepoMock.Verify(r => r.RequestTerminationAsync(1, "RENTER", It.IsAny<string?>(), It.IsAny<decimal?>()), Times.Once);
        _notificationSenderMock.Verify(s => s.SendToUserAsync(ownerId, It.IsAny<Notification>()), Times.Once);
        _notificationSenderMock.Verify(s => s.SendToUserAsync(renterId, It.IsAny<Notification>()), Times.Never);
    }

    // UTCID06 – (N) Owner yêu cầu → Success=true, RequestTerminationAsync gọi "OWNER", notify Renter
    [Fact]
    public async Task Handle_OwnerTerminates_ReturnsSuccess_AndNotifiesRenter()
    {
        const int renterId = 10, ownerId = 99;
        var contract = BuildContract(renterId: renterId);
        var wh       = BuildWarehouse(ownerId: ownerId);
        SetupContractAndWarehouse(contract, wh);
        _contractRepoMock.Setup(r => r.RequestTerminationAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<decimal?>())).Returns(Task.CompletedTask);
        _notificationRepoMock.Setup(n => n.AddAsync(It.IsAny<Notification>())).ReturnsAsync(1);
        _notificationSenderMock.Setup(s => s.SendToUserAsync(It.IsAny<int>(), It.IsAny<Notification>())).Returns(Task.CompletedTask);

        var result = await _handler.Handle(BuildCommand(userId: ownerId), CancellationToken.None);

        Assert.True(result.Success);
        Assert.True(result.PendingApproval);
        _contractRepoMock.Verify(r => r.RequestTerminationAsync(1, "OWNER", It.IsAny<string?>(), It.IsAny<decimal?>()), Times.Once);
        _notificationSenderMock.Verify(s => s.SendToUserAsync(renterId, It.IsAny<Notification>()), Times.Once);
        _notificationSenderMock.Verify(s => s.SendToUserAsync(ownerId, It.IsAny<Notification>()), Times.Never);
    }
}
