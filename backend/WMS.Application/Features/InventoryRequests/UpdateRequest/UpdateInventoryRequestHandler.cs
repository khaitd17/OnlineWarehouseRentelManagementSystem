using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.UpdateRequest;

public record UpdateInventoryItemInput
{
    public string ItemName { get; init; } = "";
    public int Quantity { get; init; }
    public string Unit { get; init; } = "cái";
    public decimal? Weight { get; init; }
    public string? Description { get; init; }
}

public record UpdateInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int Id { get; init; }
    public int RequestorId { get; init; }   // renter who owns the request
    public string? Notes { get; init; }
    public List<UpdateInventoryItemInput>? Items { get; init; }
}

public class UpdateInventoryRequestHandler
    : IRequestHandler<UpdateInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;
    public UpdateInventoryRequestHandler(IInventoryRequestRepository repo) => _repo = repo;

    public async Task<InventoryRequestDto> Handle(
        UpdateInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING" && req.Status != "CONFIRMED")
            throw new InvalidOperationException("Chỉ có thể chỉnh sửa yêu cầu ở trạng thái Chờ tiếp nhận hoặc Chờ xử lý tại kho.");
        if (req.RenterId != cmd.RequestorId)
            throw new UnauthorizedAccessException("You do not own this request.");

        req.Notes     = cmd.Notes ?? req.Notes;
        req.UpdatedAt = DateTime.Now;

        if (cmd.Items is { Count: > 0 })
        {
            req.InventoryItems.Clear();
            foreach (var i in cmd.Items)
                req.InventoryItems.Add(new InventoryItem
                {
                    InvReqId    = req.InvReqId,
                    ItemName    = i.ItemName,
                    Quantity    = i.Quantity,
                    Unit        = i.Unit,
                    Weight      = i.Weight,
                    Description = i.Description,
                });
        }

        await _repo.UpdateAsync(req, cancellationToken);
        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
