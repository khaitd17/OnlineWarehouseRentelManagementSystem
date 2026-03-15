using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.UpdateEquipmentStatus;

public class UpdateEquipmentStatusHandler : BaseEquipmentHandler, IRequestHandler<UpdateEquipmentStatusCommand>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public UpdateEquipmentStatusHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task Handle(UpdateEquipmentStatusCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Equipment not found");

        // Staff is allowed to update status
        await EnsureCanManageEquipment(equipment.WarehouseId, request.RequestUserId, cancellationToken, isStaffAllowed: true);

        await _equipmentRepository.UpdateStatusAsync(request.EquipmentId, request.Status, cancellationToken);
    }
}
