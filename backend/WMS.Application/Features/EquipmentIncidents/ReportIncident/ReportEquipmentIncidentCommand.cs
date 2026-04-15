using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.EquipmentIncidents.ReportIncident;

public class ReportEquipmentIncidentCommand : IRequest<int>
{
    public int EquipmentId { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Severity { get; set; } = "MEDIUM";
    public List<AttachmentDto>? Attachments { get; set; }
    public int RequestUserId { get; set; }
}

public class AttachmentDto
{
    public string FileUrl { get; set; } = null!;
    public string? FileType { get; set; }
}

public class ReportEquipmentIncidentHandler : IRequestHandler<ReportEquipmentIncidentCommand, int>
{
    private readonly IEquipmentIncidentRepository _incidentRepository;
    private readonly IEquipmentRepository _equipmentRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationSender _notificationSender;

    public ReportEquipmentIncidentHandler(
        IEquipmentIncidentRepository incidentRepository,
        IEquipmentRepository equipmentRepository,
        IWarehouseRepository warehouseRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender)
    {
        _incidentRepository = incidentRepository;
        _equipmentRepository = equipmentRepository;
        _warehouseRepository = warehouseRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
    }

    public async Task<int> Handle(ReportEquipmentIncidentCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _equipmentRepository.GetByIdAsync(request.EquipmentId, cancellationToken);
        if (equipment == null) throw new KeyNotFoundException("Equipment not found.");

        if (equipment.Status == "RETIRED")
            throw new InvalidOperationException("Không thể báo cáo sự cố cho thiết bị đã thanh lý.");

        // Auto update equipment status if high/critical
        if (request.Severity == "HIGH" || request.Severity == "CRITICAL")
        {
            await _equipmentRepository.UpdateStatusAsync(request.EquipmentId, "BROKEN", cancellationToken);
            // Additionally we can log the history here, but let's just make the transition.
            await _equipmentRepository.AddHistoryAsync(new EquipmentHistory
            {
                EquipmentId = request.EquipmentId,
                PreviousStatus = equipment.Status ?? "AVAILABLE",
                NewStatus = "BROKEN",
                ChangedBy = request.RequestUserId,
                Note = $"Auto-updated from incident report: {request.Title}"
            }, cancellationToken);
        }

        var incident = new EquipmentIncident
        {
            EquipmentId = request.EquipmentId,
            WarehouseId = equipment.WarehouseId,
            ReportedById = request.RequestUserId,
            Title = request.Title,
            Description = request.Description,
            Severity = request.Severity,
            Status = "OPEN",
            CreatedAt = DateTime.UtcNow
        };

        if (request.Attachments != null)
        {
            foreach (var att in request.Attachments)
            {
                incident.Attachments.Add(new EquipmentIncidentAttachment
                {
                    FileUrl = att.FileUrl,
                    FileType = att.FileType,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        var incidentId = await _incidentRepository.CreateAsync(incident, cancellationToken);

        // Notify Manager/Owner
        var ownerId = await _warehouseRepository.FindWarehouseOwnerById(equipment.WarehouseId, cancellationToken);
        if (ownerId == null) return incidentId; // Or throw, but return is safer if we just want to save the incident

        var notification = new Notification
        {
            UserId = ownerId.Value,
            Title = "Sự cố thiết bị mới",
            Message = $"Thiết bị '{equipment.Name}' tại kho của bạn vừa được báo cáo sự cố: {request.Title}",
            Type = "EQUIPMENT_INCIDENT",
            ReferenceId = incidentId,
            ReferenceType = "Incident",
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationSender.SendToUserAsync(ownerId.Value, notification);

        return incidentId;
    }
}
