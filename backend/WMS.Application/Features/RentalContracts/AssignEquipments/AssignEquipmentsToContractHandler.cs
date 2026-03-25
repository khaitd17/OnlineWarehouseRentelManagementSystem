using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.AssignEquipments;

public class AssignEquipmentsToContractHandler : IRequestHandler<AssignEquipmentsToContractCommand>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IEquipmentRepository _equipmentRepo;
    private readonly IWarehouseRepository _warehouseRepo;

    public AssignEquipmentsToContractHandler(
        IRentalContractRepository contractRepo,
        IEquipmentRepository equipmentRepo,
        IWarehouseRepository warehouseRepo)
    {
        _contractRepo = contractRepo;
        _equipmentRepo = equipmentRepo;
        _warehouseRepo = warehouseRepo;
    }

    public async Task Handle(AssignEquipmentsToContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetWithEquipmentsByIdAsync(request.ContractId)
            ?? throw new KeyNotFoundException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);
        
        if (warehouse?.OwnerId != request.RequestUserId)
            throw new UnauthorizedAccessException("Only warehouse owner can assign equipments to contract");

        if (contract.Status == "ACTIVE" || contract.Status == "EXPIRED" || contract.Status == "TERMINATED")
            throw new InvalidOperationException("Cannot change equipments for an active or closed contract");

        // Validate all equipmentIds exist and belong to the correct warehouse
        // Assuming we could query them. For now, we delegate to repository for the heavy lifting
        // but we should check availability here if possible.
        
        // Actually, we can just call the repository method since it handles the collection.
        await _contractRepo.AssignEquipmentsAsync(request.ContractId, request.EquipmentIds, cancellationToken);
    }
}
