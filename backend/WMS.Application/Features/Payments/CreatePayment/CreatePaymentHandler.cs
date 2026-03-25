using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.CreatePayment;

public class CreatePaymentHandler : IRequestHandler<CreatePaymentCommand, CreatePaymentResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IRentalContractRepository _contractRepo;

    public CreatePaymentHandler(IRentalPaymentRepository paymentRepo, IRentalContractRepository contractRepo)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
    }

    public async Task<CreatePaymentResult> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId);

        if (contract == null)
            throw new InvalidOperationException($"Contract {request.ContractId} not found");

        // Calculate amount based on payment type
        decimal amount = request.AmountOverride ?? request.PaymentType switch
        {
            PaymentType.Deposit => contract.DepositAmount ?? contract.MonthlyPayment,
            PaymentType.Monthly => contract.MonthlyPayment,
            _ => contract.MonthlyPayment
        };

        // Check if there's already a pending payment for this contract
        var existingPendingPayment = await _paymentRepo.GetPendingPaymentByContractAsync(
            request.ContractId,
            request.PaymentType);

        if (existingPendingPayment != null)
        {
            // Return existing pending payment
            return new CreatePaymentResult
            {
                PaymentId = existingPendingPayment.PaymentId,
                PaymentCode = existingPendingPayment.PaymentCode,
                Amount = existingPendingPayment.Amount,
                Status = existingPendingPayment.Status,
                ExpiredAt = existingPendingPayment.ExpiredAt
            };
        }

        // Create new payment
        var payment = RentalPayment.Create(
            contractId: request.ContractId,
            amount: amount,
            paymentType: request.PaymentType,
            expiryHours: 48
        );

        var paymentId = await _paymentRepo.AddAsync(payment);

        // Set payment code after getting the ID
        payment.SetPaymentCode($"WMS{paymentId:D6}");
        await _paymentRepo.UpdateAsync(payment);

        return new CreatePaymentResult
        {
            PaymentId = payment.PaymentId,
            PaymentCode = payment.PaymentCode,
            Amount = payment.Amount,
            Status = payment.Status,
            ExpiredAt = payment.ExpiredAt
        };
    }
}
