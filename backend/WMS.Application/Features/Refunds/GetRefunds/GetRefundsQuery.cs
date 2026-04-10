using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Refunds.GetRefunds;

public class GetRefundsQuery : IRequest<GetRefundsResult>
{
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetRefundsResult
{
    public List<RefundDto> Refunds { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class RefundDto
{
    public int RefundId { get; set; }
    public int ContractId { get; set; }
    public string? ContractNumber { get; set; }
    public int? PaymentId { get; set; }
    public string? PaymentCode { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? RenterName { get; set; }
    public string? RenterEmail { get; set; }
}

public class GetRefundsHandler : IRequestHandler<GetRefundsQuery, GetRefundsResult>
{
    private readonly IRefundRepository _refundRepository;

    public GetRefundsHandler(IRefundRepository refundRepository)
    {
        _refundRepository = refundRepository;
    }

    public async Task<GetRefundsResult> Handle(GetRefundsQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await _refundRepository.CountByStatusAsync(request.Status);
        var refunds = await _refundRepository.GetAllWithDetailsAsync(request.Status, request.Page, request.PageSize);

        var refundDtos = refunds.Select(r => new RefundDto
        {
            RefundId = r.RefundId,
            ContractId = r.ContractId,
            ContractNumber = r.Contract?.ContractNumber,
            PaymentId = r.PaymentId,
            PaymentCode = r.Payment?.PaymentCode,
            Amount = r.Amount,
            Reason = r.Reason,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
            ProcessedAt = r.ProcessedAt,
            RenterName = r.Contract?.Renter?.FullName,
            RenterEmail = r.Contract?.Renter?.Email
        }).ToList();

        return new GetRefundsResult
        {
            Refunds = refundDtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
