using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.ListStaff;

public class GetMyMembershipQuery : IRequest<CallerMembershipDto?>
{
    public int UserId { get; set; }
    public int WarehouseId { get; set; }
}

public class GetMyMembershipHandler : IRequestHandler<GetMyMembershipQuery, CallerMembershipDto?>
{
    private readonly IStaffMembershipRepository _repo;

    public GetMyMembershipHandler(IStaffMembershipRepository repo) => _repo = repo;

    public Task<CallerMembershipDto?> Handle(GetMyMembershipQuery request, CancellationToken ct)
        => _repo.GetCallerMembershipAsync(request.UserId, request.WarehouseId, ct);
}

public class GetMyManagedWarehousesQuery : IRequest<List<ManagedWarehouseDto>>
{
    public int UserId { get; set; }
}

public class GetMyManagedWarehousesHandler : IRequestHandler<GetMyManagedWarehousesQuery, List<ManagedWarehouseDto>>
{
    private readonly IStaffMembershipRepository _repo;

    public GetMyManagedWarehousesHandler(IStaffMembershipRepository repo) => _repo = repo;

    public Task<List<ManagedWarehouseDto>> Handle(GetMyManagedWarehousesQuery request, CancellationToken ct)
        => _repo.GetManagedWarehousesAsync(request.UserId, ct);
}
