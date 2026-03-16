using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Staff.ListStaff;

// ── GetMyMembershipQuery ───────────────────────────────────────────────────
public class GetMyMembershipQuery : IRequest<CallerMembershipDto?>
{
    public int UserId { get; set; }
    public int WarehouseId { get; set; }
}

public class GetMyMembershipHandler : IRequestHandler<GetMyMembershipQuery, CallerMembershipDto?>
{
    private readonly IStaffMembershipRepository _repo;

    public GetMyMembershipHandler(IStaffMembershipRepository repo)
    {
        _repo = repo;
    }

    public async Task<CallerMembershipDto?> Handle(GetMyMembershipQuery request, CancellationToken ct)
        => await _repo.GetCallerMembershipAsync(request.UserId, request.WarehouseId, ct);
}

// ── GetMyManagedWarehousesQuery ────────────────────────────────────────────
public class GetMyManagedWarehousesQuery : IRequest<List<ManagedWarehouseDto>>
{
    public int UserId { get; set; }
}

public class ManagedWarehouseDto
{
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string RoleCode { get; set; } = null!;
}

public class GetMyManagedWarehousesHandler : IRequestHandler<GetMyManagedWarehousesQuery, List<ManagedWarehouseDto>>
{
    private readonly IStaffMembershipRepository _repo;

    public GetMyManagedWarehousesHandler(IStaffMembershipRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<ManagedWarehouseDto>> Handle(GetMyManagedWarehousesQuery request, CancellationToken ct)
        => await _repo.GetManagedWarehousesAsync(request.UserId, ct);
}
