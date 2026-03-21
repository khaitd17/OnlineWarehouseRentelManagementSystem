using MediatR;

namespace WMS.Application.Features.Warehouses.DeleteWarehouseMedia;

public class DeleteWarehouseMediaCommand : IRequest<bool>
{
    public int MediaId { get; set; }
}
