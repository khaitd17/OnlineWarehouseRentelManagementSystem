using MediatR;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.WarehouseGrid.RemoveGridLocation;

public class RemoveGridLocationHandler : IRequestHandler<RemoveGridLocationCommand>
{
    private readonly IWarehouseGridLocationRepository _gridRepo;

    public RemoveGridLocationHandler(IWarehouseGridLocationRepository gridRepo)
    {
        _gridRepo = gridRepo;
    }

    public async Task Handle(RemoveGridLocationCommand request, CancellationToken cancellationToken)
    {
        await _gridRepo.RemoveGridLocationByIdAsync(request.WarehouseId, request.Id, request.QuantityToRemove, cancellationToken);
    }
}
