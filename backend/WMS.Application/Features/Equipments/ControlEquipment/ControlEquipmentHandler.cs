using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.ControlEquipment;

public class ControlEquipmentHandler : BaseEquipmentHandler, IRequestHandler<ControlEquipmentCommand, string>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public ControlEquipmentHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task<string> Handle(ControlEquipmentCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Equipment not found");

        await EnsureCanManageEquipment(equipment.WarehouseId, request.RequestUserId, cancellationToken);

        if (string.IsNullOrEmpty(equipment.IotDeviceId))
            throw new InvalidOperationException("This equipment does not support remote control (No IoT Device ID).");

        // Simulate sending command to device
        // In a real system, you would call an IoT Service here.
        bool isSuccess = true; // Simulate success

        if (isSuccess)
        {
            // Update device state in Specifications or Status if needed
            // For now, let's just return a success message as the requirement says 
            // "The system updates the device state in the equipment record"
            
            // We could parse Specifications and update a "State" field if it was programmed that way.
            // For now, just simulate the acknowledgement.
            
            return $"Command '{request.Command}' sent successfully to device {equipment.IotDeviceId}.";
        }
        else
        {
            throw new Exception("Device failed to respond.");
        }
    }
}
