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
            Amount = p.Amount,
            Status = p.Status,
            PaidAt = p.PaidAt,
            ExpiredAt = p.ExpiredAt,
            CreatedAt = p.CreatedAt
        }).ToList();
    }
}
