using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Equipments.RecordMaintenance;

public class RecordMaintenanceHandler : BaseEquipmentHandler, IRequestHandler<RecordMaintenanceCommand>
{
    private readonly IEquipmentRepository _equipmentRepository;

    public RecordMaintenanceHandler(
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository,
        IEquipmentRepository equipmentRepository) 
        : base(warehouseRepository, membershipRepository)
    {
        _equipmentRepository = equipmentRepository;
    }

    public async Task Handle(RecordMaintenanceCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Equipment not found");

        var role = await EnsureCanManageEquipment(equipment.WarehouseId, request.RequestUserId, cancellationToken, isStaffAllowed: true);

        if (role == "STAFF")
            throw new UnauthorizedAccessException("Nhân viên (STAFF) chỉ được phép báo lỗi. Quyền ghi nhận bảo trì yêu cầu Vận hành viên (OPERATOR) trở lên.");

        var record = new EquipmentMaintenanceRecord
        {
            EquipmentId = request.EquipmentId,
            MaintenanceDate = request.MaintenanceDate ?? DateTime.UtcNow,
            MaintenanceType = request.MaintenanceType,
            Description = request.Description,
            TotalCost = request.TotalCost,
            PerformedBy = request.PerformedBy,
            ResolutionStatus = request.ResolutionStatus,
            Note = request.Note
        };

        await _equipmentRepository.AddMaintenanceRecordAsync(record, cancellationToken);

        // Update equipment's maintenance metadata
        string? previousStatus = equipment.Status;
        equipment.LastMaintenanceDate = DateOnly.FromDateTime(record.MaintenanceDate.Value);
        
        if (equipment.MaintenanceCycleDays.HasValue)
        {
            equipment.NextMaintenanceDate = equipment.LastMaintenanceDate?.AddDays(equipment.MaintenanceCycleDays.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.NewEquipmentStatus))
        {
            equipment.Status = request.NewEquipmentStatus.ToUpper();
            
            // Add history record for status change
            if (previousStatus != equipment.Status)
            {
                await _equipmentRepository.AddHistoryAsync(new EquipmentHistory
                {
                    EquipmentId = request.EquipmentId,
                    PreviousStatus = previousStatus,
                    NewStatus = equipment.Status,
                    ChangedBy = request.RequestUserId,
                    Note = $"Status updated after maintenance: {request.Note}"
                }, cancellationToken);
            }
        }

        await _equipmentRepository.UpdateAsync(equipment, cancellationToken);
    }
}
