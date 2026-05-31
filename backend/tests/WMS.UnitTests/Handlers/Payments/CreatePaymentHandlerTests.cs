using Moq;
using WMS.Application.Features.Payments.CreatePayment;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using System.Reflection;

namespace WMS.UnitTests;

public class CreatePaymentHandlerTests
{
    private readonly Mock<IRentalPaymentRepository> _mockPaymentRepository;
    private readonly Mock<IRentalContractRepository> _mockContractRepository;
    private readonly Mock<IWarehouseRepository> _mockWarehouseRepository;
    private readonly Mock<INotificationRepository> _mockNotificationRepository;
    private readonly Mock<INotificationSender> _mockNotificationSender;
    private readonly CreatePaymentHandler _handler;

    public CreatePaymentHandlerTests()
    {
        _mockPaymentRepository = new Mock<IRentalPaymentRepository>();
        _mockContractRepository = new Mock<IRentalContractRepository>();
        _mockWarehouseRepository = new Mock<IWarehouseRepository>();
        _mockNotificationRepository = new Mock<INotificationRepository>();
        _mockNotificationSender = new Mock<INotificationSender>();

        _handler = new CreatePaymentHandler(
            _mockPaymentRepository.Object,
            _mockContractRepository.Object,
            _mockWarehouseRepository.Object,
            _mockNotificationRepository.Object,
            _mockNotificationSender.Object
        );
    }

    private static RentalContract CreateTestContract(int contractId, int warehouseId, int renterId, 
        decimal depositAmount, decimal monthlyPayment, string contractNumber = "C001")
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
        }

        return contract!;
    }

    private static RentalPayment CreateTestPayment(int paymentId, int contractId, decimal amount, 
        string status = PaymentStatus.Pending, string paymentCode = "WMS000123")
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

    #region Precondition Tests

    [Fact]
    public async Task Handle_ContractNotFound_ThrowsException()
    {
        var command = new CreatePaymentCommand { ContractId = 999, PaymentType = PaymentType.Deposit };
        _mockContractRepository.Setup(x => x.GetByIdAsync(999))
            .ReturnsAsync((RentalContract?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ValidServerConnection_CanConnectAndCreatePayment()
    {
        var command = new CreatePaymentCommand { ContractId = 123, PaymentType = PaymentType.Deposit };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);
        var payment = CreateTestPayment(0, 123, 500000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Deposit))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .Callback<RentalPayment>(p =>
            {
                typeof(RentalPayment).GetField("<PaymentId>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                    ?.SetValue(p, 123);
            })
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(123, result.PaymentId);
    }

    #endregion

    #region Condition Tests - Payment Type

    [Fact]
    public async Task Handle_DepositPaymentType_UsesDepositAmount()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Deposit 
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Deposit))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(500000m, result.Amount);
    }

    [Fact]
    public async Task Handle_MonthlyPaymentType_UsesMonthlyAmount()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Monthly 
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Monthly))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(1000000m, result.Amount);
    }

    [Fact]
    public async Task Handle_CashPaymentWithConfirmation_SendsNotificationToOwner()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Monthly,
            PaymentMethod = "CASH",
            Status = "PENDING_CONFIRMATION",
            ProofUrl = "https://example.com/proof.jpg",
            TransactionCode = "TXN001"
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Monthly))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        _mockNotificationRepository.Verify(x => x.AddAsync(It.IsAny<Notification>()), Times.Once);
        _mockNotificationSender.Verify(x => x.SendToUserAsync(3, It.IsAny<Notification>()), Times.Once);
    }

    #endregion

    #region Condition Tests - Amount Override

    [Fact]
    public async Task Handle_AmountOverride_UsesOverrideValue()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Monthly,
            AmountOverride = 500000
        };
        var contract = CreateTestContract(123, 1, 2, 200000, 1000000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Monthly))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(500000m, result.Amount);
    }

    #endregion

    #region Boundary Tests

    [Fact]
    public async Task Handle_ExistingPendingPaymentExists_ReturnsPendingPaymentDetails()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Deposit 
        };
        var existingPayment = CreateTestPayment(456, 123, 500000);
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Deposit))
            .ReturnsAsync(existingPayment);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(456, result.PaymentId);
        Assert.Equal("WMS000123", result.PaymentCode);
        Assert.Equal(500000m, result.Amount);
        _mockPaymentRepository.Verify(x => x.AddAsync(It.IsAny<RentalPayment>()), Times.Never);
    }

    #endregion

    #region Exception Tests

    [Fact]
    public async Task Handle_DatabaseError_ThrowsException()
    {
        var command = new CreatePaymentCommand { ContractId = 123 };
        _mockContractRepository.Setup(x => x.GetByIdAsync(It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_NotificationSendingFailure_StillCompletesPaymentCreation()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Monthly,
            PaymentMethod = "CASH",
            Status = "PENDING_CONFIRMATION",
            ProofUrl = "https://example.com/proof.jpg",
            TransactionCode = "TXN001"
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Monthly))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .Callback<RentalPayment>(p =>
            {
                typeof(RentalPayment).GetField("<PaymentId>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                    ?.SetValue(p, 123);
            })
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);
        _mockNotificationRepository.Setup(x => x.AddAsync(It.IsAny<Notification>()))
            .ReturnsAsync(1);

        var result = await _handler.Handle(command, CancellationToken.None);
        Assert.NotNull(result);
        Assert.Equal(123, result.PaymentId);
    }

    #endregion

    #region Return Tests

    [Fact]
    public async Task Handle_CreatedPayment_ReturnsPaymentDetails()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Deposit 
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);
        var payment = CreateTestPayment(0, 123, 500000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Deposit))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .Callback<RentalPayment>(p =>
            {
                typeof(RentalPayment).GetField("<PaymentId>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                    ?.SetValue(p, 123);
            })
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(123, result.PaymentId);
        Assert.NotEmpty(result.PaymentCode);
        Assert.Equal(500000m, result.Amount);
        Assert.NotEmpty(result.Status);
        Assert.NotNull(result.ExpiredAt);
    }

    #endregion

    #region Boundary Tests - Amount

    // ── UTC011 — Boundary: AmountOverride = 0 → uses contract default ──
    [Fact]
    public async Task Handle_AmountOverrideZero_UsesContractDefault()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Monthly,
            AmountOverride = 0   // zero → fallback to contract monthly
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Monthly))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(1000000m, result.Amount);  // falls back to contract monthly
    }

    // ── UTC012 — Boundary: Negative AmountOverride → uses contract default ──
    [Fact]
    public async Task Handle_NegativeAmountOverride_UsesContractDefault()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Monthly,
            AmountOverride = -1000000   // negative → fallback to contract monthly
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Monthly))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(1000000m, result.Amount);  // negative treated as invalid, falls back
    }

    // ── UTC013 — Boundary: Very large AmountOverride (10 billion) → accepts ──
    [Fact]
    public async Task Handle_VeryLargeAmountOverride_UsesOverrideValue()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Monthly,
            AmountOverride = 10000000000m   // 10 billion — large boundary
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Monthly))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.Equal(10000000000m, result.Amount);
    }

    // ── UTC014 — Abnormal: PENDING_CONFIRMATION status with CASH payment → sends notification ──
    [Fact]
    public async Task Handle_PendingConfirmationStatus_SendsNotification()
    {
        var command = new CreatePaymentCommand 
        { 
            ContractId = 123, 
            PaymentType = PaymentType.Deposit,
            PaymentMethod = "BANK_TRANSFER",
            Status = "PENDING_CONFIRMATION",
            TransactionCode = "TXN001",
            ProofUrl = "https://example.com/proof.jpg"
        };
        var contract = CreateTestContract(123, 1, 2, 500000, 1000000);
        var warehouse = new Warehouse { WarehouseId = 1, OwnerId = 3 };

        _mockContractRepository.Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync(contract);
        _mockPaymentRepository.Setup(x => x.GetPendingPaymentByContractAsync(123, PaymentType.Deposit))
            .ReturnsAsync((RentalPayment?)null);
        _mockPaymentRepository.Setup(x => x.GetByContractIdAsync(123))
            .ReturnsAsync(new List<RentalPayment>());
        _mockPaymentRepository.Setup(x => x.AddAsync(It.IsAny<RentalPayment>()))
            .Callback<RentalPayment>(p =>
            {
                typeof(RentalPayment).GetField("<PaymentId>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                    ?.SetValue(p, 123);
            })
            .ReturnsAsync(123);
        _mockPaymentRepository.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>()))
            .Returns(Task.CompletedTask);
        _mockPaymentRepository.Setup(x => x.UpdatePaymentCodeAsync(It.IsAny<int>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _mockWarehouseRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(warehouse);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        _mockNotificationRepository.Verify(x => x.AddAsync(It.IsAny<Notification>()), Times.Once);
        _mockNotificationSender.Verify(x => x.SendToUserAsync(3, It.IsAny<Notification>()), Times.Once);
    }

    #endregion
}
