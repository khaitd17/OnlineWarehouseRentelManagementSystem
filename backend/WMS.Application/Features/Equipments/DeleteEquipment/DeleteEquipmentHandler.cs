using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.DeleteEquipment;

public class DeleteEquipmentHandler : BaseEquipmentHandler, IRequestHandler<DeleteEquipmentCommand>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public DeleteEquipmentHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task Handle(DeleteEquipmentCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Equipment not found");

        // Only OWNER or OPERATOR can delete
        await EnsureCanManageEquipment(equipment.WarehouseId, request.RequestUserId, cancellationToken, isDelete: true);

        // Optional: Check if equipment is linked to something. 
        // For now, no explicit links found in domain entities.

        await _equipmentRepository.DeleteAsync(request.EquipmentId, cancellationToken);
    }
}
