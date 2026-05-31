using Moq;
using WMS.Application.Features.Payments.ConfirmCashPayment;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using System.Reflection;

namespace WMS.UnitTests;

/// <summary>
/// Unit Tests — ConfirmCashPaymentHandler.Handle()
/// Code Module : ApproveWarehouseHandler (PaymentModule)
/// Method      : ConfirmCashPaymentHandler.Handle()
/// Test Req    : Admin or authorized party approves or rejects cash payment with dual-party approval flow.
/// Total TCs   : 10 (UTC001–UTC010)
/// </summary>
public class ConfirmCashPaymentHandlerTests
{
    private readonly Mock<IRentalPaymentRepository> _mockPaymentRepository;
    private readonly Mock<IRentalContractRepository> _mockContractRepository;
    private readonly Mock<IWarehouseRepository> _mockWarehouseRepository;
    private readonly Mock<INotificationRepository> _mockNotificationRepository;
    private readonly Mock<INotificationSender> _mockNotificationSender;
    private readonly Mock<IStaffMembershipRepository> _mockMembershipRepository;
    private readonly Mock<IContractExtensionRepository> _mockExtensionRepository;
    private readonly Mock<ILogger<ConfirmCashPaymentHandler>> _mockLogger;
    private readonly Mock<IRentalRequestRepository> _mockRentalRequestRepository;
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly ConfirmCashPaymentHandler _handler;

    public ConfirmCashPaymentHandlerTests()
    {
        _mockPaymentRepository = new Mock<IRentalPaymentRepository>();
        _mockContractRepository = new Mock<IRentalContractRepository>();
        _mockWarehouseRepository = new Mock<IWarehouseRepository>();
        _mockNotificationRepository = new Mock<INotificationRepository>();
        _mockNotificationSender = new Mock<INotificationSender>();
        _mockMembershipRepository = new Mock<IStaffMembershipRepository>();
        _mockExtensionRepository = new Mock<IContractExtensionRepository>();
        _mockLogger = new Mock<ILogger<ConfirmCashPaymentHandler>>();
        _mockRentalRequestRepository = new Mock<IRentalRequestRepository>();
        _mockUserRepository = new Mock<IUserRepository>();
        _mockEmailService = new Mock<IEmailService>();

        _handler = new ConfirmCashPaymentHandler(
            _mockPaymentRepository.Object,
            _mockContractRepository.Object,
            _mockWarehouseRepository.Object,
            _mockNotificationRepository.Object,
            _mockNotificationSender.Object,
            _mockMembershipRepository.Object,
            _mockLogger.Object,
            _mockExtensionRepository.Object,
            _mockRentalRequestRepository.Object,
            _mockUserRepository.Object,
            _mockEmailService.Object
        );
    }

    private static RentalPayment CreateTestPayment(int paymentId, int contractId, decimal amount = 1000000m,
        string status = PaymentStatus.PendingConfirmation, string paymentCode = "WMS000123")
    {
        var payment = typeof(RentalPayment).GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance,
            null,
            [],
            null)?.Invoke([]) as RentalPayment;

        if (payment != null)
        {
            var type = typeof(RentalPayment);
            type.GetField("<PaymentId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(payment, paymentId);
            type.GetField("<ContractId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(payment, contractId);
            type.GetField("<Amount>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(payment, amount);
            type.GetField("<PaymentCode>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(payment, paymentCode);
            type.GetField("<ExpiredAt>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(payment, DateTime.UtcNow.AddDays(2));
            type.GetField("<CreatedAt>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(payment, DateTime.UtcNow);
            type.GetField("<Status>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(payment, status);
        }

        return payment!;
    }

    private static RentalContract CreateTestContract(int contractId, int warehouseId, int renterId,
        decimal depositAmount = 500000m, decimal monthlyPayment = 1000000m,
        string status = RentalContractStatus.PendingPayment, string contractNumber = "C001")
    {
        var contract = typeof(RentalContract).GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance,
            null,
            [],
            null)?.Invoke([]) as RentalContract;

        if (contract != null)
        {
            var type = typeof(RentalContract);
            type.GetField("<ContractId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, contractId);
            type.GetField("<WarehouseId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, warehouseId);
            type.GetField("<RenterId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, renterId);
            type.GetField("<DepositAmount>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, depositAmount);
            type.GetField("<MonthlyPayment>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, monthlyPayment);
            type.GetField("<ContractNumber>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, contractNumber);
            type.GetField("<RentalRequestId>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, 1);
            type.GetField("<StartDate>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, DateTime.UtcNow);
            type.GetField("<EndDate>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, DateTime.UtcNow.AddMonths(12));
            type.GetField("<TotalValue>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, monthlyPayment * 12);
            type.GetField("<CreatedAt>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, DateTime.UtcNow);
            type.GetField("<Status>k__BackingField", BindingFlags.NonPublic | BindingFlags.Instance)?.SetValue(contract, status);
        }

        return contract!;
    }

    #region Precondition & Condition Tests

    // ── UTC001 — Normal: Approve payment with PENDING_CONFIRMATION → COMPLETED ──
    [Fact]
    public async Task UTC001_CanConnectWithServer_ProcessesPaymentConfirmation()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = true
        };
        var payment = CreateTestPayment(123, 456);
        var contract = CreateTestContract(456, 1, 2, status: RentalContractStatus.PendingPayment);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalContract>()))
            .Returns(Task.CompletedTask);
        _mockMembershipRepository.Setup(x => x.GetCallerMembershipAsync(2, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CallerMembershipDto?)null);
        _mockMembershipRepository.Setup(x => x.CreateMembershipAsync(It.IsAny<CreateMembershipDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
    }

    // ── UTC002 — Normal: Reject payment → CANCELLED ──
    [Fact]
    public async Task UTC002_RejectPayment_UpdatesPaymentToCancelled()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = false,
            RejectionReason = "Chưa nhận tiền"
        };
        var payment = CreateTestPayment(123, 456);
        var contract = CreateTestContract(456, 1, 2, status: RentalContractStatus.PendingPayment);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        _mockPaymentRepository.Verify(x => x.UpdateAsync(It.Is<RentalPayment>(p => p.Status == PaymentStatus.Cancelled)), Times.Once);
    }

    // ── UTC003 — Abnormal: PaymentId = 999 (not exists) → False ──
    [Fact]
    public async Task UTC003_PaymentNotFound_ReturnsFalse()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 999,
            OwnerId = 3,
            IsApproved = true
        };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(999))
            .ReturnsAsync((RentalPayment?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("Không tìm thấy thanh toán", result.Message);
    }

    // ── UTC004 — Abnormal: Payment status = COMPLETED (not PENDING_CONFIRMATION) → False ──
    [Fact]
    public async Task UTC004_PaymentNotPendingConfirmation_ReturnsFalse()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = true
        };
        var payment = CreateTestPayment(123, 456, status: PaymentStatus.Completed);

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("không ở trạng thái chờ xác nhận", result.Message);
    }

    // ── UTC005 — Abnormal: ContractId not found → False ──
    [Fact]
    public async Task UTC005_ContractNotFound_ReturnsFalse()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = true
        };
        var payment = CreateTestPayment(123, 456);

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync((RentalContract?)null);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("Không tìm thấy hợp đồng", result.Message);
    }

    // ── UTC006 — Abnormal: OwnerId = 999 (not owner) → False ──
    [Fact]
    public async Task UTC006_OwnerNotAuthorized_ReturnsFalse()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 999,
            IsApproved = true
        };
        var payment = CreateTestPayment(123, 456);
        var contract = CreateTestContract(456, 1, 2, status: RentalContractStatus.PendingPayment);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("không có quyền", result.Message);
    }

    #endregion

    #region Condition Tests - Approve/Reject Flow

    // ── UTC007 — Normal: Approve payment → creates renter membership ──
    [Fact]
    public async Task UTC007_ApprovePayment_CreatesRenterMembership()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = true
        };
        var payment = CreateTestPayment(123, 456);
        var contract = CreateTestContract(456, 1, 2, status: RentalContractStatus.PendingPayment);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalContract>()))
            .Returns(Task.CompletedTask);
        _mockMembershipRepository.Setup(x => x.GetCallerMembershipAsync(2, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CallerMembershipDto?)null);
        _mockMembershipRepository.Setup(x => x.CreateMembershipAsync(It.IsAny<CreateMembershipDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        _mockMembershipRepository.Verify(x => x.CreateMembershipAsync(
            It.Is<CreateMembershipDto>(m => m.UserId == 2 && m.WarehouseId == 1 && m.RoleCode == "RENTER"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ── UTC008 — Normal: Reject payment → sends notification to renter ──
    [Fact]
    public async Task UTC008_RejectPayment_SendsNotificationToRenter()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = false,
            RejectionReason = "Số tiền không khớp"
        };
        var payment = CreateTestPayment(123, 456);
        var contract = CreateTestContract(456, 1, 2, status: RentalContractStatus.PendingPayment);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        _mockNotificationSender.Verify(x => x.SendToUserAsync(2, It.IsAny<Notification>()), Times.Once);
    }

    #endregion

    #region Return Tests

    // ── UTC009 — Boundary: Approved payment → returns Success with Message and NewContractStatus ──
    [Fact]
    public async Task UTC009_ApprovedPayment_ReturnsSuccessWithMessage()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = true
        };
        var payment = CreateTestPayment(123, 456);
        var contract = CreateTestContract(456, 1, 2, status: RentalContractStatus.PendingPayment);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);
        _mockContractRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalContract>()))
            .Returns(Task.CompletedTask);
        _mockMembershipRepository.Setup(x => x.GetCallerMembershipAsync(2, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CallerMembershipDto?)null);
        _mockMembershipRepository.Setup(x => x.CreateMembershipAsync(It.IsAny<CreateMembershipDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotEmpty(result.Message);
        Assert.False(string.IsNullOrEmpty(result.NewContractStatus));
    }

    // ── UTC010 — Boundary: Database error during confirmation → throws exception ──
    [Fact]
    public async Task UTC010_DatabaseError_ThrowsException()
    {
        var command = new ConfirmCashPaymentCommand
        {
            PaymentId = 123,
            OwnerId = 3,
            IsApproved = true
        };
        var payment = CreateTestPayment(123, 456);
        var contract = CreateTestContract(456, 1, 2, status: RentalContractStatus.PendingPayment);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockPaymentRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(payment);
        _mockContractRepository.Setup(x => x.GetByIdAsync(456))
            .ReturnsAsync(contract);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .ThrowsAsync(new Exception("Database error"));

        await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    #endregion
}
