using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.DeleteRequest;

public record DeleteInventoryRequestCommand : IRequest<Unit>
{
    public int Id { get; init; }
    public int RequestorId { get; init; }
}

public class DeleteInventoryRequestHandler
    : IRequestHandler<DeleteInventoryRequestCommand, Unit>
{
    private readonly IInventoryRequestRepository _repo;
    public DeleteInventoryRequestHandler(IInventoryRequestRepository repo) => _repo = repo;

    public async Task<Unit> Handle(DeleteInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING")
            throw new InvalidOperationException("Only PENDING requests can be deleted.");
        if (req.RenterId != cmd.RequestorId)
            throw new UnauthorizedAccessException("You do not own this request.");

        await _repo.DeleteAsync(cmd.Id, cancellationToken);
        return Unit.Value;
    }
}
