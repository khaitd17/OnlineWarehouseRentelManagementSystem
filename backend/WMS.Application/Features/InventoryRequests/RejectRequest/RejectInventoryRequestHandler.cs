using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.RejectRequest;

// ─── Command ─────────────────────────────────────────────────────────────────
public record RejectInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int Id { get; init; }
    public int ManagerId { get; init; }
    public string? Reason { get; init; }
    public string? Role { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class RejectInventoryRequestHandler
    : IRequestHandler<RejectInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;

    public RejectInventoryRequestHandler(IInventoryRequestRepository repo)
        => _repo = repo;

    public async Task<InventoryRequestDto> Handle(
        RejectInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING" && req.Status != "CONFIRMED")
            throw new InvalidOperationException(
                $"Chỉ có thể từ chối yêu cầu ở trạng thái Chờ tiếp nhận hoặc Chờ xử lý tại kho. Trạng thái hiện tại: '{req.Status}'.");

        req.Status    = "REJECTED";
        var rolePrefix = cmd.Role == "OWNER" ? "Chủ kho" : "Nhân viên";
        req.Notes     = string.IsNullOrEmpty(cmd.Reason)
            ? req.Notes
            : $"{rolePrefix}: Từ chối: {cmd.Reason}\n{req.Notes}";
        req.UpdatedAt = DateTime.Now;

        await _repo.UpdateAsync(req, cancellationToken);

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
