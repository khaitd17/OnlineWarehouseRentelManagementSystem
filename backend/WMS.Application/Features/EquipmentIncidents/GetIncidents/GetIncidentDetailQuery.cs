using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.EquipmentIncidents.GetIncidents;

public class GetIncidentDetailQuery : IRequest<IncidentDetailDto?>
{
    public int Id { get; set; }
}

public class IncidentDetailDto
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public string EquipmentName { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Severity { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string ReportedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<CommentDto> Comments { get; set; } = new();
    public List<AttachmentDto> Attachments { get; set; } = new();
}

public class CommentDto
{
    public int Id { get; set; }
    public string Comment { get; set; } = null!;
    public string UserFullName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class AttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = null!;
    public string FileType { get; set; } = null!;
    public string Url { get; set; } = null!;
}

public class GetIncidentDetailHandler : IRequestHandler<GetIncidentDetailQuery, IncidentDetailDto?>
{
    private readonly IEquipmentIncidentRepository _incidentRepository;

    public GetIncidentDetailHandler(IEquipmentIncidentRepository incidentRepository)
    {
        _incidentRepository = incidentRepository;
    }

    public async Task<IncidentDetailDto?> Handle(GetIncidentDetailQuery request, CancellationToken ct)
    {
        var incident = await _incidentRepository.GetByIdAsync(request.Id, ct);
        if (incident == null) return null;

        return new IncidentDetailDto
        {
            Id = incident.Id,
            EquipmentId = incident.EquipmentId,
            EquipmentName = incident.Equipment.Name,
            Title = incident.Title,
            Description = incident.Description,
            Severity = incident.Severity,
            Status = incident.Status,
            ReportedBy = incident.ReportedBy.FullName,
            CreatedAt = incident.CreatedAt,
            ResolvedAt = incident.ResolvedAt,
            Comments = incident.Comments.OrderBy(c => c.CreatedAt).Select(c => new CommentDto
            {
                Id = c.Id,
                Comment = c.Content,
                UserFullName = c.User.FullName,
                CreatedAt = c.CreatedAt
            }).ToList(),
            Attachments = incident.Attachments.Select(a => new AttachmentDto
            {
                Id = a.Id,
                FileName = "File", // Temporarily default as FileName is missing in Entity
                FileType = a.FileType ?? "unknown",
                Url = a.FileUrl
            }).ToList()
        };
    }
}
