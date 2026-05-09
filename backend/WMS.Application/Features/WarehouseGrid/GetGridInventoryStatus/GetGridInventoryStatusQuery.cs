using MediatR;
using System.Collections.Generic;
using WMS.Domain.Models;

namespace WMS.Application.Features.WarehouseGrid.GetGridInventoryStatus;

public class GetGridInventoryStatusQuery : IRequest<List<GridInventoryStatusModel>>
{
    public int WarehouseId { get; set; }
}
