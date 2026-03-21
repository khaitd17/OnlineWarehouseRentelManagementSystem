using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.AddEquipment;

public class AddEquipmentHandler : BaseEquipmentHandler, IRequestHandler<AddEquipmentCommand, int>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public AddEquipmentHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task<int> Handle(AddEquipmentCommand request, CancellationToken cancellationToken)
    {
        await EnsureCanManageEquipment(request.WarehouseId, request.RequestUserId, cancellationToken);

        var equipment = new Equipment
        {
            WarehouseId = request.WarehouseId,
            Name = request.Name,
            Type = string.IsNullOrWhiteSpace(request.Type) ? null : request.Type,
            Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description,
            Specifications = string.IsNullOrWhiteSpace(request.Specifications) ? null : request.Specifications,
            IotDeviceId = string.IsNullOrWhiteSpace(request.IotDeviceId) ? null : request.IotDeviceId,
            Status = "ACTIVE",
        };

        return await _equipmentRepository.CreateAsync(equipment, cancellationToken);
    }
}
