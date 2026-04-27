using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.DeleteWarehouse;

public class DeleteWarehouseHandler : IRequestHandler<DeleteWarehouseCommand, bool>
{
    private readonly IWarehouseRepository _repository;
    private readonly IRentalContractRepository _contractRepository;

    public DeleteWarehouseHandler(IWarehouseRepository repository, IRentalContractRepository contractRepository)
    {
        _repository = repository;
        _contractRepository = contractRepository;
    }

    public async Task<bool> Handle(DeleteWarehouseCommand request, CancellationToken cancellationToken)
    {
        var ownerId = await _repository.FindWarehouseOwnerById(request.WarehouseId, cancellationToken);
        if (ownerId == null || ownerId != request.CallerId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa kho này hoặc kho không tồn tại.");
        }

        // Kiểm tra xem kho có hợp đồng nào đang ở trạng thái hiệu lực hay không
        var contracts = await _contractRepository.GetByWarehouseIdAsync(request.WarehouseId);
        var activeStatuses = new[] 
        {
            WMS.Domain.Enums.RentalContractStatus.PendingOwnerSignature,
            WMS.Domain.Enums.RentalContractStatus.PendingRenterSignature,
            WMS.Domain.Enums.RentalContractStatus.Active,
            WMS.Domain.Enums.RentalContractStatus.Signed,
            WMS.Domain.Enums.RentalContractStatus.PendingPayment,
            WMS.Domain.Enums.RentalContractStatus.Overdue,
            WMS.Domain.Enums.RentalContractStatus.PendingTermination,
            WMS.Domain.Enums.RentalContractStatus.PendingClose
        };

        if (contracts.Any(c => activeStatuses.Contains(c.Status)))
        {
            throw new InvalidOperationException("Không thể xóa kho vì đang có hợp đồng hoạt động (thuê).");
        }

        await _repository.DeleteAsync(request.WarehouseId, cancellationToken);
        return true;
    }
}
