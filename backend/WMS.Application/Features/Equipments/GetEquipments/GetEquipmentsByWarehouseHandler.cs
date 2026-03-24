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
            RentalAreaId = e.RentalAreaId,
            RentalAreaName = e.RentalArea?.Name,
            Name = e.Name,
            Type = e.Type,
            SerialNumber = e.SerialNumber,
            Location = e.Location,
            Description = e.Description,
            Note = e.Note,
            Status = e.Status,
            Specifications = e.Specifications,
            MaintenanceCycleDays = e.MaintenanceCycleDays,
            IotDeviceId = e.IotDeviceId,
            CreatedAt = e.CreatedAt,
            LastUpdated = e.UpdatedAt,
            LastMaintenanceDate = e.LastMaintenanceDate,
            NextMaintenanceDate = e.NextMaintenanceDate
        }).ToList();
    }
}
