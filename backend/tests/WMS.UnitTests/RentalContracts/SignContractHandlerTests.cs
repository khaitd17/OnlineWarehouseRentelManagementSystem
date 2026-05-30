using Moq;
using WMS.Application.Features.RentalContracts.SignContract;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using static WMS.Application.Interfaces.IUserRepository;

namespace WMS.UnitTests.RentalContracts;

public class SignContractHandlerTests
{
    private readonly Mock<IRentalContractRepository>       _contractRepoMock;
    private readonly Mock<IContractLogRepository>          _logRepoMock;
    private readonly Mock<IPdfService>                     _pdfServiceMock;
    private readonly Mock<INotificationRepository>         _notificationRepoMock;
    private readonly Mock<INotificationSender>             _notificationSenderMock;
    private readonly Mock<IWarehouseRepository>            _warehouseRepoMock;
    private readonly Mock<IUserRepository>                 _userRepoMock;
    private readonly SignContractHandler                   _handler;

    public SignContractHandlerTests()
    {
        _contractRepoMock       = new Mock<IRentalContractRepository>();
        _logRepoMock            = new Mock<IContractLogRepository>();
        _pdfServiceMock         = new Mock<IPdfService>();
        _notificationRepoMock   = new Mock<INotificationRepository>();
        _notificationSenderMock = new Mock<INotificationSender>();
        _warehouseRepoMock      = new Mock<IWarehouseRepository>();
        _userRepoMock           = new Mock<IUserRepository>();

        _handler = new SignContractHandler(
            _contractRepoMock.Object,
            _logRepoMock.Object,
            _pdfServiceMock.Object,
            _notificationRepoMock.Object,
            _notificationSenderMock.Object,
            _warehouseRepoMock.Object,
            _userRepoMock.Object);
    }

    private static RentalContract BuildContract(
        int contractId  = 1, int renterId = 10, int warehouseId = 5,
        int rentalReqId = 2, string status = "NEGOTIATING",
        string contractNo = "RTC-2026-00001")
    {
        var c = (RentalContract)System.Runtime.CompilerServices.RuntimeHelpers
            .GetUninitializedObject(typeof(RentalContract));
        typeof(RentalContract).GetProperty(nameof(RentalContract.ContractId))!.SetValue(c, contractId);
        typeof(RentalContract).GetProperty(nameof(RentalContract.RenterId))!.SetValue(c, renterId);
        typeof(RentalContract).GetProperty(nameof(RentalContract.WarehouseId))!.SetValue(c, warehouseId);
        typeof(RentalContract).GetProperty(nameof(RentalContract.RentalRequestId))!.SetValue(c, rentalReqId);
        typeof(RentalContract).GetProperty(nameof(RentalContract.Status))!.SetValue(c, status);
        typeof(RentalContract).GetProperty(nameof(RentalContract.ContractNumber))!.SetValue(c, contractNo);
        typeof(RentalContract).GetProperty(nameof(RentalContract.MonthlyPayment))!.SetValue(c, 5_000_000m);
        typeof(RentalContract).GetProperty(nameof(RentalContract.TotalValue))!.SetValue(c, 60_000_000m);
        typeof(RentalContract).GetProperty(nameof(RentalContract.StartDate))!.SetValue(c, DateTime.UtcNow);
        typeof(RentalContract).GetProperty(nameof(RentalContract.EndDate))!.SetValue(c, DateTime.UtcNow.AddMonths(12));
        typeof(RentalContract).GetProperty(nameof(RentalContract.IncludedEquipments))!.SetValue(c, new List<Equipment>());
        typeof(RentalContract).GetProperty(nameof(RentalContract.EquipmentUsageLogs))!.SetValue(c, new List<EquipmentHistory>());
        return c;
    }

    private static Warehouse BuildWarehouse(int warehouseId = 5, int ownerId = 99)
        => new() { WarehouseId = warehouseId, OwnerId = ownerId, Name = "Kho A", Address = "123" };

    private static UserRecord BuildUserRecord(int userId, string name = "User A")
        => new(userId, name, $"u{userId}@test.com", "hash", null, null, null, "User", null);

    private static SignContractCommand BuildCommand(int contractId = 1, int userId = 10)
        => new() { ContractId = contractId, UserId = userId, SignatureBase64 = "base64SIG==", IpAddress = "127.0.0.1" };

    private void SetupHappyPath(RentalContract contract)
    {
        var wh = BuildWarehouse();
        _pdfServiceMock.Setup(p => p.GenerateContractPdfAsync(It.IsAny<ContractPdfData>(), It.IsAny<string?>())).ReturnsAsync("https://storage/signed.pdf");
        _contractRepoMock.Setup(r => r.UpdateAsync(It.IsAny<RentalContract>())).Returns(Task.CompletedTask);
        _logRepoMock.Setup(l => l.AddAsync(It.IsAny<ContractLog>())).ReturnsAsync(1);
        _notificationRepoMock.Setup(n => n.AddAsync(It.IsAny<Notification>())).ReturnsAsync(1);
        _notificationSenderMock.Setup(s => s.SendToUserAsync(It.IsAny<int>(), It.IsAny<Notification>())).Returns(Task.CompletedTask);
        _warehouseRepoMock.Setup(w => w.GetByIdAsync(contract.WarehouseId, It.IsAny<CancellationToken>())).ReturnsAsync(wh);
        _userRepoMock.Setup(u => u.GetByIdAsync(contract.RenterId, It.IsAny<CancellationToken>())).ReturnsAsync(BuildUserRecord(contract.RenterId));
        _userRepoMock.Setup(u => u.GetByIdAsync(wh.OwnerId, It.IsAny<CancellationToken>())).ReturnsAsync(BuildUserRecord(wh.OwnerId, "Chủ kho B"));
    }

    // UTCID01 – (A) Contract không tồn tại → InvalidOperationException
    [Fact]
    public async Task Handle_ContractNotFound_ThrowsInvalidOperationException()
    {
        _contractRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((RentalContract?)null);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.Handle(BuildCommand(), CancellationToken.None));

        Assert.Equal("Contract not found", ex.Message);
    }

    // UTCID02 – (B) Người dùng không phải là Renter (UserId ≠ RenterId) → UnauthorizedAccessException
    [Fact]
    public async Task Handle_UserIsNotRenter_ThrowsUnauthorizedAccessException()
    {
        var contract = BuildContract(renterId: 10);
        _contractRepoMock.Setup(r => r.GetByIdAsync(contract.ContractId)).ReturnsAsync(contract);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _handler.Handle(BuildCommand(userId: 88), CancellationToken.None));

        Assert.Equal("Only the renter can sign the contract", ex.Message);
    }

    // UTCID03 – (B) Contract Status không hợp lệ (≠ NEGOTIATING, DRAFT, APPROVED_FOR_SIGNING) → InvalidOperationException
    [Fact]
    public async Task Handle_WrongStatus_ThrowsInvalidOperationException()
    {
        const string wrongStatus = "REVISION_REQUESTED";
        var contract = BuildContract(renterId: 10, status: wrongStatus);
        _contractRepoMock.Setup(r => r.GetByIdAsync(contract.ContractId)).ReturnsAsync(contract);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.Handle(BuildCommand(userId: 10), CancellationToken.None));

        Assert.Contains("Cannot sign contract with status", ex.Message);
        Assert.Contains(wrongStatus, ex.Message);
    }

    // UTCID04 – (N) Happy path: Ký thành công, ghi log CONTRACT_SIGNED_BY_RENTER và gửi thông báo
    [Fact]
    public async Task Handle_ValidSign_ReturnsResult_AndLogsAndNotifiesBothParties()
    {
        const int renterId = 10, ownerId = 99;
        var contract     = BuildContract(renterId: renterId, warehouseId: 5, status: "NEGOTIATING");

        _contractRepoMock.Setup(r => r.GetByIdAsync(contract.ContractId)).ReturnsAsync(contract);
        SetupHappyPath(contract);

        var result = await _handler.Handle(BuildCommand(userId: renterId), CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.SignedFileUrl));
        Assert.False(string.IsNullOrEmpty(result.Status));
        _logRepoMock.Verify(l => l.AddAsync(It.Is<ContractLog>(x => x.Action == "CONTRACT_SIGNED_BY_RENTER")), Times.Once);
        _notificationSenderMock.Verify(s => s.SendToUserAsync(renterId, It.IsAny<Notification>()), Times.Once);
        _notificationSenderMock.Verify(s => s.SendToUserAsync(ownerId, It.IsAny<Notification>()), Times.Once);
    }
}
