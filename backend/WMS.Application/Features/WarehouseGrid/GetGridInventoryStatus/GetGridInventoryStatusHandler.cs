using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Interfaces;
using WMS.Domain.Models;

namespace WMS.Application.Features.WarehouseGrid.GetGridInventoryStatus;

public class GetGridInventoryStatusHandler : IRequestHandler<GetGridInventoryStatusQuery, List<GridInventoryStatusModel>>
{
    private readonly IWarehouseGridLocationRepository _gridRepo;

    public GetGridInventoryStatusHandler(IWarehouseGridLocationRepository gridRepo)
    {
        _gridRepo = gridRepo;
    }

    public async Task<List<GridInventoryStatusModel>> Handle(GetGridInventoryStatusQuery request, CancellationToken cancellationToken)
    {
        return await _gridRepo.GetGridInventoryStatusAsync(request.WarehouseId, cancellationToken);
    }
}
