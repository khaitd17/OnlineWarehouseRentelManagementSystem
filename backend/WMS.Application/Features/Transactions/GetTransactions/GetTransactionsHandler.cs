using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Transactions.GetTransactions;

// ─── DTOs ────────────────────────────────────────────────────────────────────
public record TransactionDto
{
    public int TransactionId { get; init; }
    public int InvReqId { get; init; }
    public string Type { get; init; } = "";
    public int WarehouseId { get; init; }
    public string WarehouseName { get; init; } = "";
    public string ItemName { get; init; } = "";
    public int Quantity { get; init; }
    public string Unit { get; init; } = "";
    public int PerformedBy { get; init; }
    public string PerformedByName { get; init; } = "";
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record PagedTransactionResult
{
    public List<TransactionDto> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
}

// ─── Query ───────────────────────────────────────────────────────────────────
public record GetTransactionsQuery : IRequest<PagedTransactionResult>
{
    public int? WarehouseId { get; init; }
    public string? Type { get; init; }
    public string? ItemName { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class GetTransactionsHandler
    : IRequestHandler<GetTransactionsQuery, PagedTransactionResult>
{
    private readonly IInventoryTransactionRepository _repo;
    public GetTransactionsHandler(IInventoryTransactionRepository repo) => _repo = repo;

    public async Task<PagedTransactionResult> Handle(
        GetTransactionsQuery q, CancellationToken cancellationToken)
    {
        var (items, total) = await _repo.GetAllAsync(
            q.WarehouseId, q.Type, q.ItemName, q.From, q.To,
            q.Page, q.PageSize, cancellationToken);

        return new PagedTransactionResult
        {
            Items = items.Select(t => new TransactionDto
            {
                TransactionId  = t.TransactionId,
                InvReqId       = t.InvReqId,
                Type           = t.Type,
                WarehouseId    = t.WarehouseId,
                WarehouseName  = t.Warehouse?.Name ?? "",
                ItemName       = t.ItemName,
                Quantity       = t.Quantity,
                Unit           = t.Unit,
                PerformedBy    = t.PerformedBy,
                PerformedByName = t.PerformedByNavigation?.FullName ?? "",
                Notes          = t.Notes,
                CreatedAt      = t.CreatedAt,
            }).ToList(),
            TotalCount = total,
            Page       = q.Page,
            PageSize   = q.PageSize,
            TotalPages = (int)Math.Ceiling((double)total / q.PageSize),
        };
    }
}
