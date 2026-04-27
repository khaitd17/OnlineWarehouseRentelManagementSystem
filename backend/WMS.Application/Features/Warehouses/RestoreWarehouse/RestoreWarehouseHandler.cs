using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.RestoreWarehouse;

public class RestoreWarehouseHandler : IRequestHandler<RestoreWarehouseCommand, bool>
{
    private readonly IWarehouseRepository _repository;

    public RestoreWarehouseHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RestoreWarehouseCommand request, CancellationToken cancellationToken)
    {
        var ownerId = await _repository.FindWarehouseOwnerById(request.WarehouseId, cancellationToken);
        if (ownerId == null || ownerId != request.CallerId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thu hồi kho này hoặc kho không tồn tại.");
        }

        await _repository.RestoreAsync(request.WarehouseId, cancellationToken);
        return true;
    }
}
