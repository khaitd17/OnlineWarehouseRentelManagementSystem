using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.PostRentalInspection;

public class PostRentalInspectionHandler : BaseEquipmentHandler, IRequestHandler<PostRentalInspectionCommand>
{
    private readonly IEquipmentRepository _equipmentRepository;
    private readonly IRentalContractRepository _contractRepository;

    public PostRentalInspectionHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository,
        IRentalContractRepository contractRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
        _contractRepository = contractRepository;
    }

    public async Task Handle(PostRentalInspectionCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepository.GetWithEquipmentsByIdAsync(request.ContractId)
            ?? throw new KeyNotFoundException("Contract not found");

        await EnsureCanManageEquipment(contract.WarehouseId, request.RequestUserId, cancellationToken, isStaffAllowed: true);

        // Allow inspection only if contract is TERMINATED, EXPIRED or maybe ACTIVE (if returning early)
        // But status should be checked.
        
        foreach (var inspection in request.Inspections)
        {
            var equipment = contract.IncludedEquipments.FirstOrDefault(e => e.EquipmentId == inspection.EquipmentId);
            if (equipment == null) continue;

            string previousStatus = equipment.Status ?? "IN_USE";
            equipment.Status = inspection.NewStatus.ToUpper();
            equipment.UpdatedAt = DateTime.UtcNow;

            await _equipmentRepository.UpdateAsync(equipment, cancellationToken);

            // Add history record
            await _equipmentRepository.AddHistoryAsync(new EquipmentHistory
            {
                EquipmentId = equipment.EquipmentId,
                PreviousStatus = previousStatus,
                NewStatus = equipment.Status,
                ContractId = contract.ContractId,
                ChangedBy = request.RequestUserId,
                Note = $"Post-rental inspection: {inspection.Note ?? "Inspected after rental end"}"
            }, cancellationToken);
        }
    }
}
