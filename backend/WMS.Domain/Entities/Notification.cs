namespace WMS.Domain.Entities;

public class Notification
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = null!;
    public int? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public bool IsRead { get; set; }
    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
    
    // Factory method
    public static Notification Create(
        int receiverUserId,
        string title,
        string message,
        string notificationType = "IN_APP",
        int? referenceId = null,
        string? referenceType = null)
    {
        return new Notification
        {
            UserId = receiverUserId,
            Title = title,
            Message = message,
            Type = notificationType,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
    }
}
