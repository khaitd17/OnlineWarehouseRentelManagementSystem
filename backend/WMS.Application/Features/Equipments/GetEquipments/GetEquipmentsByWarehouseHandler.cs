using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.GetEquipments;

public class GetEquipmentsByWarehouseHandler : BaseEquipmentHandler, IRequestHandler<GetEquipmentsByWarehouseQuery, List<EquipmentDto>>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public GetEquipmentsByWarehouseHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task<List<EquipmentDto>> Handle(GetEquipmentsByWarehouseQuery request, CancellationToken cancellationToken)
    {
        // For viewing, staff is allowed
        await EnsureCanManageEquipment(request.WarehouseId, request.RequestUserId, cancellationToken, isStaffAllowed: true);

        var equipments = await _equipmentRepository.GetByWarehouseIdAsync(request.WarehouseId, cancellationToken);

        return equipments.Select(e => new EquipmentDto
        {
            EquipmentId = e.EquipmentId,
            WarehouseId = e.WarehouseId,
            Name = e.Name,
            Type = e.Type,
            Location = e.Location,
            Description = e.Description,
            Status = e.Status,
            Specifications = e.Specifications,
            IotDeviceId = e.IotDeviceId,
            LastUpdated = e.UpdatedAt
        }).ToList();
    }
}
