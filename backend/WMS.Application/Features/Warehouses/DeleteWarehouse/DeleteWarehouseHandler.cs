using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.DeleteWarehouse;

public class DeleteWarehouseHandler : IRequestHandler<DeleteWarehouseCommand, bool>
{
    private readonly IWarehouseRepository _repository;

    public DeleteWarehouseHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteWarehouseCommand request, CancellationToken cancellationToken)
    {
        var ownerId = await _repository.FindWarehouseOwnerById(request.WarehouseId, cancellationToken);
        if (ownerId == null || ownerId != request.CallerId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa kho này hoặc kho không tồn tại.");
        }

        await _repository.DeleteAsync(request.WarehouseId, cancellationToken);
        return true;
    }
}
