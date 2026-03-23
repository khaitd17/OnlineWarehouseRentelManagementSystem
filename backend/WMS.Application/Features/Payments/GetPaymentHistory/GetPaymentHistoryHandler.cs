using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.GetPaymentHistory;

public record PaymentDto
{
    public int       PaymentId            { get; init; }
    public int       ContractId           { get; init; }
    public string?   ContractNumber       { get; init; }
    public int       WarehouseId          { get; init; }
    public string    WarehouseName        { get; init; } = "";
    public int       RenterId             { get; init; }
    public string    RenterName           { get; init; } = "";
    public decimal   Amount               { get; init; }
    public string?   PaymentPeriod        { get; init; }
    public DateTime? PaymentDate          { get; init; }
    public DateOnly? DueDate              { get; init; }
    public string?   PaymentMethod        { get; init; }
    public string?   Status               { get; init; }
    public string?   TransactionReference { get; init; }
    public string?   Notes                { get; init; }
}

public record PagedPaymentResult
{
    public List<PaymentDto> Items  { get; init; } = new();
    public int TotalCount          { get; init; }
    public int Page                { get; init; }
    public int PageSize            { get; init; }
    public int TotalPages          { get; init; }
}

public record GetPaymentHistoryQuery : IRequest<PagedPaymentResult>
{
    public int       UserId   { get; init; }
    public string?   Status   { get; init; }
    public DateTime? From     { get; init; }
    public DateTime? To       { get; init; }
    public int       Page     { get; init; } = 1;
    public int       PageSize { get; init; } = 20;
}

public class GetPaymentHistoryHandler
    : IRequestHandler<GetPaymentHistoryQuery, PagedPaymentResult>
{
    private readonly IPaymentRepository _repo;

    public GetPaymentHistoryHandler(IPaymentRepository repo) => _repo = repo;

    public async Task<PagedPaymentResult> Handle(
        GetPaymentHistoryQuery q, CancellationToken cancellationToken)
    {
        var (items, total) = await _repo.GetByUserAsync(
            q.UserId, q.Status, q.From, q.To,
            q.Page, q.PageSize, cancellationToken);

        return new PagedPaymentResult
        {
            Items = items.Select(p => new PaymentDto
            {
                PaymentId            = p.PaymentId,
                ContractId           = p.ContractId,
                ContractNumber       = p.Contract?.ContractNumber,
                WarehouseId          = p.Contract?.WarehouseId ?? 0,
                WarehouseName        = p.Contract?.Warehouse?.Name ?? "",
                RenterId             = p.Contract?.RenterId ?? 0,
                RenterName           = p.Contract?.Renter?.FullName ?? "",
                Amount               = p.Amount,
                PaymentPeriod        = p.PaymentPeriod,
                PaymentDate          = p.PaymentDate,
                DueDate              = p.DueDate,
                PaymentMethod        = p.PaymentMethod,
                Status               = p.Status,
                TransactionReference = p.TransactionReference,
                Notes                = p.Notes,
            }).ToList(),
            TotalCount = total,
            Page       = q.Page,
            PageSize   = q.PageSize,
            TotalPages = (int)Math.Ceiling((double)total / q.PageSize),
        };
    }
}
