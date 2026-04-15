using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.ApproveRequest;

// ─── Command ─────────────────────────────────────────────────────────────────
public record ApproveInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int     Id        { get; init; }
    public int     ManagerId { get; init; }
    public string? Note      { get; init; }
    public string? Role      { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class ApproveInventoryRequestHandler
    : IRequestHandler<ApproveInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;
    private readonly ITaskRepository _taskRepo;

    public ApproveInventoryRequestHandler(
        IInventoryRequestRepository repo,
        ITaskRepository taskRepo)
    {
        _repo     = repo;
        _taskRepo = taskRepo;
    }

    public async Task<InventoryRequestDto> Handle(
        ApproveInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING")
            throw new InvalidOperationException(
                $"Chỉ có thể duyệt yêu cầu đang ở trạng thái PENDING. Trạng thái hiện tại: '{req.Status}'.");

        req.Status      = "CONFIRMED";
        req.ConfirmedBy = cmd.ManagerId;
        req.ConfirmedAt = DateTime.Now;
        req.UpdatedAt   = DateTime.Now;

        // Ghi chú phê duyệt (append vào Notes nếu có)
        if (!string.IsNullOrWhiteSpace(cmd.Note))
        {
            var rolePrefix = cmd.Role == "OWNER" ? "Chủ kho" : "Nhân viên";
            req.Notes = string.IsNullOrEmpty(req.Notes)
                ? $"{rolePrefix}: {cmd.Note}"
                : $"{rolePrefix}: {cmd.Note}\n{req.Notes}";
        }

        await _repo.UpdateAsync(req, cancellationToken);

        // Đóng UnitTask tương ứng với bước duyệt đơn
        var approveCode = req.Type == "OUTBOUND"
            ? "OUTBOUND_APPROVE"
            : "INBOUND_APPROVE";
        try { await _taskRepo.CompleteUnitTaskAsync(req.Type, req.InvReqId, approveCode, cmd.ManagerId, cancellationToken); }
        catch { /* Task không tìm thấy — không chặn nghiệp vụ */ }

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
