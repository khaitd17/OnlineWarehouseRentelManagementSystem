namespace WMS.Application.Features.Notifications.Common;

public class NotificationDto
{
    public int NotificationId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = null!;
    public int? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public bool IsRead { get; set; }
    public DateTime? CreatedAt { get; set; }
}
