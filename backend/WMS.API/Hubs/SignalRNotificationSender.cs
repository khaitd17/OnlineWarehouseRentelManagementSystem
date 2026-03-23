using Microsoft.AspNetCore.SignalR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;

namespace WMS.API.Hubs;

public class SignalRNotificationSender : INotificationSender
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationSender(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUserAsync(int userId, Notification notification)
    {
        await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
        {
            notificationId = notification.NotificationId,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            referenceId = notification.ReferenceId,
            referenceType = notification.ReferenceType,
            isRead = notification.IsRead,
            createdAt = notification.CreatedAt
        });
    }
}
