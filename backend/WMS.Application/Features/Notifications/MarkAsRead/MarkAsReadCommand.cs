using MediatR;

namespace WMS.Application.Features.Notifications.MarkAsRead;

public class MarkAsReadCommand : IRequest<Unit>
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
}
