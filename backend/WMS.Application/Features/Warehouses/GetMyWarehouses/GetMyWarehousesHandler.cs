using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetMyWarehouses;

public class GetMyWarehousesHandler : IRequestHandler<GetMyWarehousesQuery, List<MyWarehouseItemDto>>
{
    private readonly IStaffMembershipRepository _repo;

    public GetMyWarehousesHandler(IStaffMembershipRepository repo) => _repo = repo;

    public Task<List<MyWarehouseItemDto>> Handle(GetMyWarehousesQuery request, CancellationToken ct)
        => _repo.GetMyWarehousesAsync(request.UserId, ct);
}
