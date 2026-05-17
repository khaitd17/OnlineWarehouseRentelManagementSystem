using MediatR;

namespace WMS.Application.Features.WarehouseGrid.GetRenterSpaceUsage;

public class GetRenterSpaceUsageQuery : IRequest<RenterSpaceUsageDto>
{
    public int WarehouseId { get; set; }
    public int RenterId { get; set; }
}

public class RenterSpaceUsageDto
{
    public double ContractedArea { get; set; }
    public double OccupiedArea { get; set; }
    public int OccupiedCells { get; set; }
}
