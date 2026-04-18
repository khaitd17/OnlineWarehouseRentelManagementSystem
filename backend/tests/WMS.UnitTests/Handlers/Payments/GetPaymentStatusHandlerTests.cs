using System.Reflection;
using Microsoft.Extensions.Logging;
using Moq;
using WMS.Application.Features.Payments.GetPaymentStatus;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests;

public class GetPaymentStatusHandlerTests
{
    private readonly Mock<IRentalPaymentRepository> _paymentRepoMock = new();
    private readonly Mock<IRentalContractRepository> _contractRepoMock = new();
    private readonly Mock<ISepayService> _sepayServiceMock = new();
    private readonly Mock<ILogger<GetPaymentStatusHandler>> _loggerMock = new();
    private readonly Mock<IContractExtensionRepository> _extensionRepoMock = new();

    private GetPaymentStatusHandler CreateHandler()
    {
        return new GetPaymentStatusHandler(
            _paymentRepoMock.Object,
            _contractRepoMock.Object,
            _sepayServiceMock.Object,
            _loggerMock.Object,
            _extensionRepoMock.Object);
    }

    [Fact]
    public async Task Handle_PendingPayment_WithMatchingSepayTransaction_CompletesAndActivatesContract()
    {
        var payment = CreatePendingPayment(paymentId: 1, contractId: 10, amount: 500000m, code: "WMS000010");
        var contract = CreatePendingContract(contractId: 10);

        _paymentRepoMock.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(payment);
        _sepayServiceMock.Setup(x => x.CheckTransactionAsync("WMS000010")).ReturnsAsync(new TransactionInfo
        {
            Id = 999,
            Amount = 500000m,
            Content = "Thanh toan WMS000010",
            ReferenceCode = "WMS000010"
        });
        _contractRepoMock.Setup(x => x.GetByIdAsync(10)).ReturnsAsync(contract);
        _paymentRepoMock.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>())).Returns(Task.CompletedTask);
        _contractRepoMock.Setup(x => x.UpdateAsync(It.IsAny<RentalContract>())).Returns(Task.CompletedTask);

        var handler = CreateHandler();
        var result = await handler.Handle(new GetPaymentStatusQuery { PaymentId = 1 }, CancellationToken.None);

        Assert.Equal(PaymentStatus.Completed, result.Status);
        Assert.Equal(999, result.SepayTransactionId);
        _paymentRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalPayment>()), Times.Once);
        _contractRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalContract>()), Times.Once);
    }

    [Fact]
    public async Task Handle_CompletedPayment_WithPendingContract_ActivatesContractWithoutSepayCall()
    {
        var payment = CreatePendingPayment(paymentId: 2, contractId: 20, amount: 700000m, code: "WMS000020");
        payment.CompleteFromSepay(222, "WMS000020");

        var contract = CreatePendingContract(contractId: 20);

        _paymentRepoMock.Setup(x => x.GetByIdAsync(2)).ReturnsAsync(payment);
        _contractRepoMock.Setup(x => x.GetByIdAsync(20)).ReturnsAsync(contract);
        _contractRepoMock.Setup(x => x.UpdateAsync(It.IsAny<RentalContract>())).Returns(Task.CompletedTask);

        var handler = CreateHandler();
        var result = await handler.Handle(new GetPaymentStatusQuery { PaymentId = 2 }, CancellationToken.None);

        Assert.Equal(PaymentStatus.Completed, result.Status);
        Assert.Equal(222, result.SepayTransactionId);
        _sepayServiceMock.Verify(x => x.CheckTransactionAsync(It.IsAny<string>()), Times.Never);
        _paymentRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalPayment>()), Times.Never);
        _contractRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalContract>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PendingPayment_WithMismatchedSepayTransaction_KeepsPending()
    {
        var payment = CreatePendingPayment(paymentId: 3, contractId: 30, amount: 300000m, code: "WMS000030");

        _paymentRepoMock.Setup(x => x.GetByIdAsync(3)).ReturnsAsync(payment);
        _sepayServiceMock.Setup(x => x.CheckTransactionAsync("WMS000030")).ReturnsAsync(new TransactionInfo
        {
            Id = 333,
            Amount = 300000m,
            Content = "Thanh toan khong hop le",
            ReferenceCode = "UNKNOWN"
        });

        var handler = CreateHandler();
        var result = await handler.Handle(new GetPaymentStatusQuery { PaymentId = 3 }, CancellationToken.None);

        Assert.Equal(PaymentStatus.Pending, result.Status);
        Assert.Null(result.SepayTransactionId);
        _paymentRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalPayment>()), Times.Never);
        _contractRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalContract>()), Times.Never);
    }

    [Fact]
    public async Task Handle_PendingPayment_WhenSiblingPaymentMatchesSepay_ReturnsCompletedSibling()
    {
        var currentPayment = CreatePendingPayment(paymentId: 35, contractId: 19, amount: 600000m, code: "WMS000035");
        var siblingPayment = CreatePendingPayment(paymentId: 34, contractId: 19, amount: 600000m, code: "WMS000034");

        // Current payment must be the latest one for sibling reconciliation guard.
        SetAutoProperty(currentPayment, nameof(RentalPayment.CreatedAt), DateTime.UtcNow);
        SetAutoProperty(siblingPayment, nameof(RentalPayment.CreatedAt), DateTime.UtcNow.AddMinutes(-1));

        var contract = CreatePendingContract(contractId: 19);

        _paymentRepoMock.Setup(x => x.GetByIdAsync(35)).ReturnsAsync(currentPayment);
        _paymentRepoMock.Setup(x => x.GetByContractIdAsync(19)).ReturnsAsync(new[] { currentPayment, siblingPayment });

        _sepayServiceMock.Setup(x => x.CheckTransactionAsync("WMS000035")).ReturnsAsync((TransactionInfo?)null);
        _sepayServiceMock.Setup(x => x.CheckTransactionAsync("WMS000034")).ReturnsAsync(new TransactionInfo
        {
            Id = 3400,
            Amount = 600000m,
            Content = "Thanh toan WMS000034",
            ReferenceCode = "WMS000034"
        });

        _contractRepoMock.Setup(x => x.GetByIdAsync(19)).ReturnsAsync(contract);
        _paymentRepoMock.Setup(x => x.UpdateAsync(It.IsAny<RentalPayment>())).Returns(Task.CompletedTask);
        _contractRepoMock.Setup(x => x.UpdateAsync(It.IsAny<RentalContract>())).Returns(Task.CompletedTask);

        var handler = CreateHandler();
        var result = await handler.Handle(new GetPaymentStatusQuery { PaymentId = 35 }, CancellationToken.None);

        Assert.Equal(34, result.PaymentId);
        Assert.Equal(PaymentStatus.Completed, result.Status);
        Assert.Equal(3400, result.SepayTransactionId);

        _sepayServiceMock.Verify(x => x.CheckTransactionAsync("WMS000035"), Times.Once);
        _sepayServiceMock.Verify(x => x.CheckTransactionAsync("WMS000034"), Times.Once);
        _paymentRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalPayment>()), Times.Once);
        _contractRepoMock.Verify(x => x.UpdateAsync(It.IsAny<RentalContract>()), Times.Once);
    }

    private static RentalPayment CreatePendingPayment(int paymentId, int contractId, decimal amount, string code)
    {
        var payment = RentalPayment.Create(contractId, amount, PaymentType.Deposit);
        payment.SetPaymentCode(code);
        SetAutoProperty(payment, nameof(RentalPayment.PaymentId), paymentId);
        return payment;
    }

    private static RentalContract CreatePendingContract(int contractId)
    {
        var ctor = typeof(RentalContract).GetConstructor(
            BindingFlags.Instance | BindingFlags.NonPublic,
            null,
            Type.EmptyTypes,
            null);

        var contract = (RentalContract)(ctor?.Invoke(null)
            ?? throw new InvalidOperationException("Cannot create RentalContract instance for test"));

        SetAutoProperty(contract, nameof(RentalContract.ContractId), contractId);
        SetAutoProperty(contract, nameof(RentalContract.Status), RentalContractStatus.PendingPayment);

        return contract;
    }

    private static void SetAutoProperty<T>(object target, string propertyName, T value)
    {
        var field = target.GetType().GetField(
            $"<{propertyName}>k__BackingField",
            BindingFlags.Instance | BindingFlags.NonPublic);

        field?.SetValue(target, value);
    }
}
