using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.UpdateEquipment;

public class UpdateEquipmentHandler : BaseEquipmentHandler, IRequestHandler<UpdateEquipmentCommand>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public UpdateEquipmentHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task Handle(UpdateEquipmentCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Equipment not found");

        await EnsureCanManageEquipment(equipment.WarehouseId, request.RequestUserId, cancellationToken);

        equipment.Name = request.Name;
        equipment.Type = string.IsNullOrWhiteSpace(request.Type) ? null : request.Type;
        equipment.Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location;
        equipment.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description;
        equipment.Specifications = string.IsNullOrWhiteSpace(request.Specifications) ? null : request.Specifications;
        equipment.IotDeviceId = string.IsNullOrWhiteSpace(request.IotDeviceId) ? null : request.IotDeviceId;

        await _equipmentRepository.UpdateAsync(equipment, cancellationToken);
    }
}
