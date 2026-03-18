using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.DeleteWarehouseMedia;

public class DeleteWarehouseMediaHandler : IRequestHandler<DeleteWarehouseMediaCommand, bool>
{
    private readonly IWarehouseMediaRepository _repository;

    public DeleteWarehouseMediaHandler(IWarehouseMediaRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteWarehouseMediaCommand request, CancellationToken cancellationToken)
    {
        return await _repository.DeleteMediaAsync(request.MediaId, cancellationToken);
    }
}
