using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.ConfirmRequest;

public record ConfirmInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int Id { get; init; }
    public int StaffId { get; init; }
    public string? Notes { get; init; }
}

public class ConfirmInventoryRequestHandler
    : IRequestHandler<ConfirmInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;
    private readonly IWarehouseInventoryRepository _invRepo;
    private readonly IInventoryTransactionRepository _txRepo;

    public ConfirmInventoryRequestHandler(
        IInventoryRequestRepository repo,
        IWarehouseInventoryRepository invRepo,
        IInventoryTransactionRepository txRepo)
    {
        _repo    = repo;
        _invRepo = invRepo;
        _txRepo  = txRepo;
    }

    public async Task<InventoryRequestDto> Handle(
        ConfirmInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        // 1. Load request
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        // 2. Validate status
        if (req.Status != "PENDING")
            throw new InvalidOperationException(
                $"Request is already '{req.Status}' and cannot be confirmed.");

        // 3. For each item: check/update inventory and create transaction
        foreach (var item in req.InventoryItems)
        {
            int delta = req.Type == "OUTBOUND" ? -item.Quantity : item.Quantity;

            // This throws if OUTBOUND and insufficient stock
            await _invRepo.AdjustQuantityAsync(
                req.WarehouseId, item.ItemName, item.Unit, delta, cancellationToken);

            // 4. Create transaction record per item
            await _txRepo.CreateAsync(new InventoryTransaction
            {
                InvReqId    = req.InvReqId,
                Type        = req.Type,
                WarehouseId = req.WarehouseId,
                ItemName    = item.ItemName,
                Quantity    = item.Quantity,
                Unit        = item.Unit,
                PerformedBy = cmd.StaffId,
                Notes       = cmd.Notes,
            }, cancellationToken);
        }

        // 5. Update request status to COMPLETED
        req.Status      = "COMPLETED";
        req.ConfirmedBy = cmd.StaffId;
        req.ConfirmedAt = DateTime.Now;
        req.UpdatedAt   = DateTime.Now;
        await _repo.UpdateAsync(req, cancellationToken);

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
