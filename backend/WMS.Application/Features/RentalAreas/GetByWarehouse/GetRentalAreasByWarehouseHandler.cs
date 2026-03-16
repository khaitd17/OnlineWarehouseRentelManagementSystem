using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalAreas.GetByWarehouse;

public class GetRentalAreasByWarehouseHandler : IRequestHandler<GetRentalAreasByWarehouseQuery, List<RentalArea>>
{
    private readonly IRentalAreaRepository _rentalAreaRepository;

    public GetRentalAreasByWarehouseHandler(IRentalAreaRepository rentalAreaRepository)
    {
        _rentalAreaRepository = rentalAreaRepository;
    }

    public async Task<List<RentalArea>> Handle(GetRentalAreasByWarehouseQuery request, CancellationToken cancellationToken)
    {
        return await _rentalAreaRepository.GetByWarehouseIdAsync(request.WarehouseId, cancellationToken);
    }
}
