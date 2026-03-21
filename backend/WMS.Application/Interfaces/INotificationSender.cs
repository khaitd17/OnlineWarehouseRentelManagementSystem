using WMS.Domain.Entities;

namespace WMS.Application.Interfaces;

public interface INotificationSender
{
    Task SendToUserAsync(int userId, Notification notification);
}
