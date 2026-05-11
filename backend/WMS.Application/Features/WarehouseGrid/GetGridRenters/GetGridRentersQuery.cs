using MediatR;
using System.Collections.Generic;

namespace WMS.Application.Features.WarehouseGrid.GetGridRenters;

public class GetGridRentersQuery : IRequest<List<string>>
{
    public int WarehouseId { get; set; }
}
