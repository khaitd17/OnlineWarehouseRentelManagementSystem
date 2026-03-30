using MediatR;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.EquipmentIncidents.UpdateIncidentStatus;

public class UpdateIncidentStatusCommand : IRequest<bool>
{
    public int IncidentId { get; set; }
    public string NewStatus { get; set; } = null!; // IN_PROGRESS, RESOLVED, CLOSED
    public string? EquipmentStatus { get; set; } // Optional: BROKEN, MAINTENANCE, AVAILABLE (READY)
    public int RequestUserId { get; set; }
}

public class UpdateIncidentStatusHandler : IRequestHandler<UpdateIncidentStatusCommand, bool>
{
    private readonly IEquipmentIncidentRepository _incidentRepository;
    private readonly IEquipmentRepository _equipmentRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IStaffMembershipRepository _membershipRepository;

    public UpdateIncidentStatusHandler(
        IEquipmentIncidentRepository incidentRepository,
        IEquipmentRepository equipmentRepository,
        IWarehouseRepository warehouseRepository,
        IStaffMembershipRepository membershipRepository)
    {
        _incidentRepository = incidentRepository;
        _equipmentRepository = equipmentRepository;
        _warehouseRepository = warehouseRepository;
        _membershipRepository = membershipRepository;
    }

    public async Task<bool> Handle(UpdateIncidentStatusCommand request, CancellationToken ct)
    {
        var incident = await _incidentRepository.GetByIdAsync(request.IncidentId, ct);
        if (incident == null) throw new KeyNotFoundException("Incident not found.");

        // Check permissions: Owner or Warehouse Manager
        var ownerId = await _warehouseRepository.FindWarehouseOwnerById(incident.WarehouseId, ct);
        var membership = await _membershipRepository.GetCallerMembershipAsync(request.RequestUserId, incident.WarehouseId, ct);

        if (ownerId != request.RequestUserId && (membership == null || membership.RoleCode != "MANAGER" && membership.RoleCode != "OPERATOR"))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật trạng thái sự cố này.");
        }

        var previousIncidentStatus = incident.Status;
        incident.Status = request.NewStatus;
        incident.UpdatedAt = DateTime.UtcNow;

        if (request.NewStatus == "RESOLVED" || request.NewStatus == "CLOSED")
        {
            incident.ResolvedAt = DateTime.UtcNow;
        }

        await _incidentRepository.UpdateAsync(incident, ct);

        // Update Equipment status if provided
        if (!string.IsNullOrEmpty(request.EquipmentStatus))
        {
            var equipment = await _equipmentRepository.GetByIdAsync(incident.EquipmentId, ct);
            if (equipment != null && equipment.Status != request.EquipmentStatus)
            {
                var previousEquipmentStatus = equipment.Status;
                equipment.Status = request.EquipmentStatus;
                equipment.UpdatedAt = DateTime.UtcNow;

                await _equipmentRepository.UpdateAsync(equipment, ct);

                // Add record to equipment history as well
                await _equipmentRepository.AddHistoryAsync(new EquipmentHistory
                {
                    EquipmentId = equipment.EquipmentId,
                    PreviousStatus = previousEquipmentStatus,
                    NewStatus = request.EquipmentStatus,
                    ChangedBy = request.RequestUserId,
                    Note = $"Cập nhật từ báo cáo sự cố #{incident.Id}: {incident.Title}",
                    CreatedAt = DateTime.UtcNow
                }, ct);
            }
        }

        return true;
    }
}
