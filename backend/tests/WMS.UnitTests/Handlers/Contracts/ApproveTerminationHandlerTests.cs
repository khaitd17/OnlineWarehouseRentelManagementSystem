using Moq;
using WMS.Application.Features.Contracts.ApproveTermination;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using System.Reflection;

namespace WMS.UnitTests;

public class ApproveTerminationHandlerTests
{
    private readonly Mock<IRentalContractRepository> _mockContractRepository;
    private readonly Mock<IWarehouseRepository> _mockWarehouseRepository;
    private readonly Mock<INotificationRepository> _mockNotificationRepository;
    private readonly Mock<INotificationSender> _mockNotificationSender;
    private readonly ApproveTerminationHandler _handler;

    public ApproveTerminationHandlerTests()
    {
        _mockContractRepository = new Mock<IRentalContractRepository>();
        _mockWarehouseRepository = new Mock<IWarehouseRepository>();
        _mockNotificationRepository = new Mock<INotificationRepository>();
        _mockNotificationSender = new Mock<INotificationSender>();
        var mockRenterAssetRepository = new Mock<IRenterAssetRepository>();
        var mockRentalRequestRepository = new Mock<IRentalRequestRepository>();

        _handler = new ApproveTerminationHandler(
            _mockContractRepository.Object,
            _mockWarehouseRepository.Object,
            _mockNotificationRepository.Object,
            _mockNotificationSender.Object,
            mockRenterAssetRepository.Object,
            mockRentalRequestRepository.Object
        );
    }

    private static RentalContract CreateTestContract(int contractId, int warehouseId, int renterId, string status)
    {
        var contract = typeof(RentalContract).GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance, 
            null, 
            [], 
            null)?.Invoke([]) as RentalContract;

        if (contract != null)
        {
            var type = typeof(RentalContract);
            var contractIdField = type.GetField("<ContractId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var warehouseIdField = type.GetField("<WarehouseId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var renterIdField = type.GetField("<RenterId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var statusField = type.GetField("<Status>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var contractNumberField = type.GetField("<ContractNumber>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var rentalRequestIdField = type.GetField("<RentalRequestId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var startDateField = type.GetField("<StartDate>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var endDateField = type.GetField("<EndDate>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var monthlyPaymentField = type.GetField("<MonthlyPayment>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var totalValueField = type.GetField("<TotalValue>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);
            var createdAtField = type.GetField("<CreatedAt>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance);

            contractIdField?.SetValue(contract, contractId);
            warehouseIdField?.SetValue(contract, warehouseId);
            renterIdField?.SetValue(contract, renterId);
            statusField?.SetValue(contract, status);
            contractNumberField?.SetValue(contract, "C001");
            rentalRequestIdField?.SetValue(contract, 1);
            startDateField?.SetValue(contract, DateTime.UtcNow);
            endDateField?.SetValue(contract, DateTime.UtcNow.AddMonths(12));
            monthlyPaymentField?.SetValue(contract, 1000000m);
            totalValueField?.SetValue(contract, 12000000m);
            createdAtField?.SetValue(contract, DateTime.UtcNow);
        }

        return contract!;
    }

    #region Precondition Tests

    [Fact]
    public async Task Handle_ContractNotFound_ReturnsFalse()
    {
        var command = new ApproveTerminationCommand { ContractId = 999, UserId = 1 };
        _mockContractRepository.Setup(x => x.GetByIdAsync(999))
            .ReturnsAsync((RentalContract?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Equal("Contract not found", result.Message);
        Assert.Equal(999, result.ContractId);
    }

    [Fact]
    public async Task Handle_WarehouseNotFound_ReturnsFalse()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 1 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Warehouse?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Equal("Warehouse not found", result.Message);
    }

    [Fact]
    public async Task Handle_UserNotOwnerOrRenter_ReturnsFalse()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 999 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Equal("You are not authorized to approve termination for this contract", result.Message);
    }

    [Theory]
    [InlineData(RentalContractStatus.Active)]
    [InlineData(RentalContractStatus.Draft)]
    [InlineData(RentalContractStatus.Signed)]
    [InlineData(RentalContractStatus.Completed)]
    [InlineData(RentalContractStatus.Cancelled)]
    public async Task Handle_InvalidContractStatus_ReturnsFalse(string status)
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 2 };
        var contract = CreateTestContract(123, 1, 2, status);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("not pending termination/close", result.Message);
    }

    #endregion

    #region Condition Tests

    [Fact]
    public async Task Handle_RenterApprovesTermination_SendsNotificationToOwner()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 2 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.Terminated);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "RENTER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        _mockNotificationRepository.Verify(x => x.AddAsync(It.IsAny<Notification>()), Times.Once);
        _mockNotificationSender.Verify(x => x.SendToUserAsync(3, It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public async Task Handle_RenterApprovesAndBothApprove_ReturnsTerminated()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 2 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.Terminated);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "RENTER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        Assert.True(result.IsFullyApproved);
        Assert.Equal(RentalContractStatus.Terminated, result.Status);
    }

    [Fact]
    public async Task Handle_OwnerApprovesTermination_SendsNotificationToRenter()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 3 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.Terminated);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "OWNER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        _mockNotificationRepository.Verify(x => x.AddAsync(It.IsAny<Notification>()), Times.Once);
        _mockNotificationSender.Verify(x => x.SendToUserAsync(2, It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ApprovePendingClose_ReturnsClosedStatus()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 2 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingClose);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.Closed);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "RENTER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        Assert.True(result.IsFullyApproved);
        Assert.Equal(RentalContractStatus.Closed, result.Status);
    }

    #endregion

    #region Boundary Tests

    [Fact]
    public async Task Handle_ApproveImmediately_WithinTwoHours_ReceivesNotification()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 3 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.Terminated);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "OWNER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        Assert.True(result.IsFullyApproved);
        _mockNotificationRepository.Verify(x => x.AddAsync(It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ApproveAfter30Days_StillReceivesNotification()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 2 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.Terminated);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "RENTER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        _mockNotificationRepository.Verify(x => x.AddAsync(It.IsAny<Notification>()), Times.Once);
    }

    #endregion

    #region Exception Tests

    [Fact]
    public async Task Handle_DatabaseError_ReturnsFalseWithErrorMessage()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 1 };
        _mockContractRepository.Setup(x => x.GetByIdAsync(It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("Error approving termination", result.Message);
    }

    #endregion

    #region Return Tests

    [Fact]
    public async Task Handle_SuccessfulApproval_ReturnsSuccessWithTrueStatus()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 2 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.Terminated);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "RENTER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal(123, result.ContractId);
        Assert.NotEmpty(result.Message);
        Assert.NotEmpty(result.Status);
    }

    [Fact]
    public async Task Handle_PartialApproval_ReturnsStatusPendingTermination()
    {
        var command = new ApproveTerminationCommand { ContractId = 123, UserId = 2 };
        var contract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };
        var updatedContract = CreateTestContract(123, 1, 2, RentalContractStatus.PendingTermination);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockContractRepository.Setup(x => x.ApproveTerminationAsync(123, "RENTER", It.IsAny<decimal?>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.SetupSequence(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract)
            .ReturnsAsync(updatedContract);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        Assert.False(result.IsFullyApproved);
        Assert.Equal(RentalContractStatus.PendingTermination, result.Status);
    }

    #endregion
}
