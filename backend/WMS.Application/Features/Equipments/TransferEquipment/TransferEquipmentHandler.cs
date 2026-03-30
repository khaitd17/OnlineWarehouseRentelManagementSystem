using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.TransferEquipment;

public class TransferEquipmentHandler : BaseEquipmentHandler, IRequestHandler<TransferEquipmentCommand>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public TransferEquipmentHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IRentalContractRepository contractRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository, contractRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task Handle(TransferEquipmentCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Equipment not found");

        await EnsureCanManageEquipment(equipment.WarehouseId, request.RequestUserId, cancellationToken);

        if (equipment.Status == "IN_USE")
            throw new InvalidOperationException("Cannot transfer equipment while it is 'IN_USE'.");

        int? previousAreaId = equipment.RentalAreaId;
        equipment.RentalAreaId = request.NewRentalAreaId;
        equipment.UpdatedAt = DateTime.UtcNow;

        await _equipmentRepository.UpdateAsync(equipment, cancellationToken);

        // Add history record
        await _equipmentRepository.AddHistoryAsync(new EquipmentHistory
        {
            EquipmentId = request.EquipmentId,
            PreviousRentalAreaId = previousAreaId,
            NewRentalAreaId = request.NewRentalAreaId,
            ChangedBy = request.RequestUserId,
            Note = request.Note ?? $"Transferred from area {previousAreaId?.ToString() ?? "Warehouse"} to {request.NewRentalAreaId?.ToString() ?? "Warehouse"}"
        }, cancellationToken);
    }
}
