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

        if (equipment.Status == "IN_USE")
            throw new InvalidOperationException("Cannot update equipment information while it is 'IN_USE'.");

        equipment.Name = request.Name;
        equipment.Type = string.IsNullOrWhiteSpace(request.Type) ? null : request.Type;
        equipment.SerialNumber = string.IsNullOrWhiteSpace(request.SerialNumber) ? null : request.SerialNumber;
        equipment.Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location;
        equipment.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description;
        equipment.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note;
        equipment.Specifications = string.IsNullOrWhiteSpace(request.Specifications) ? null : request.Specifications;
        equipment.MaintenanceCycleDays = request.MaintenanceCycleDays;
        equipment.IotDeviceId = string.IsNullOrWhiteSpace(request.IotDeviceId) ? null : request.IotDeviceId;
        equipment.RentalAreaId = request.RentalAreaId;

        await _equipmentRepository.UpdateAsync(equipment, cancellationToken);
    }
}
