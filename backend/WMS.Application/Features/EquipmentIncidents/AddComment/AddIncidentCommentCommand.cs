using MediatR;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;

namespace WMS.Application.Features.EquipmentIncidents.AddComment;

public class AddIncidentCommentCommand : IRequest<bool>
{
    public int IncidentId { get; set; }
    public string Content { get; set; } = null!;
    public int RequestUserId { get; set; }
}

public class AddIncidentCommentHandler : IRequestHandler<AddIncidentCommentCommand, bool>
{
    private readonly IEquipmentIncidentRepository _incidentRepository;

    public AddIncidentCommentHandler(IEquipmentIncidentRepository incidentRepository)
    {
        _incidentRepository = incidentRepository;
    }

    public async Task<bool> Handle(AddIncidentCommentCommand request, CancellationToken ct)
    {
        var incident = await _incidentRepository.GetByIdAsync(request.IncidentId, ct);
        if (incident == null) throw new KeyNotFoundException("Incident not found.");

        await _incidentRepository.AddCommentAsync(new EquipmentIncidentComment
        {
            IncidentId = request.IncidentId,
            UserId = request.RequestUserId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        }, ct);

        incident.UpdatedAt = DateTime.UtcNow;
        await _incidentRepository.UpdateAsync(incident, ct);

        return true;
    }
}
