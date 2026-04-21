using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.GetPaymentsByContract;

public class GetPaymentsByContractHandler : IRequestHandler<GetPaymentsByContractQuery, List<PaymentDto>>
{
    private readonly IRentalPaymentRepository _paymentRepo;

    public GetPaymentsByContractHandler(IRentalPaymentRepository paymentRepo)
    {
        _paymentRepo = paymentRepo;
    }

    public async Task<List<PaymentDto>> Handle(GetPaymentsByContractQuery request, CancellationToken cancellationToken)
    {
        var payments = await _paymentRepo.GetByContractIdAsync(request.ContractId);

        return payments.Select(p => new PaymentDto
        {
            PaymentId = p.PaymentId,
            PaymentCode = p.PaymentCode,
            PaymentType = p.PaymentType,
            PaymentMethod = p.PaymentMethod,
            Amount = p.Amount,
            Status = p.Status,
            PaidAt = p.PaidAt.HasValue ? DateTime.SpecifyKind(p.PaidAt.Value, DateTimeKind.Utc) : null,
            ExpiredAt = p.ExpiredAt.HasValue ? DateTime.SpecifyKind(p.ExpiredAt.Value, DateTimeKind.Utc) : null,
            CreatedAt = DateTime.SpecifyKind(p.CreatedAt, DateTimeKind.Utc)
        }).ToList();
    }
}
