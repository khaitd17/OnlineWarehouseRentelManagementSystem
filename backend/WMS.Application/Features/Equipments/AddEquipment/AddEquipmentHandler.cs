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
        IRentalContractRepository contractRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository, contractRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task<int> Handle(AddEquipmentCommand request, CancellationToken cancellationToken)
    {
        await EnsureCanManageEquipment(request.WarehouseId, request.RequestUserId, cancellationToken);

        var equipment = new Equipment
        {
            WarehouseId = request.WarehouseId,
            RentalAreaId = request.RentalAreaId,
            Name = request.Name,
            Type = string.IsNullOrWhiteSpace(request.Type) ? null : request.Type,
            SerialNumber = string.IsNullOrWhiteSpace(request.SerialNumber) ? null : request.SerialNumber,
            Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description,
            Specifications = string.IsNullOrWhiteSpace(request.Specifications) ? null : request.Specifications,
            MaintenanceCycleDays = request.MaintenanceCycleDays,
            IotDeviceId = string.IsNullOrWhiteSpace(request.IotDeviceId) ? null : request.IotDeviceId,
            Status = "AVAILABLE", // Default initial status
        };

        var id = await _equipmentRepository.CreateAsync(equipment, cancellationToken);

        // Add history record
        await _equipmentRepository.AddHistoryAsync(new EquipmentHistory
        {
            EquipmentId = id,
            NewStatus = "AVAILABLE",
            NewRentalAreaId = request.RentalAreaId,
            ChangedBy = request.RequestUserId,
            Note = "Initial equipment creation"
        }, cancellationToken);

        return id;
    }
}
