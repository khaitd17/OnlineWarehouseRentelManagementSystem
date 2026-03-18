using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface INotificationRepository
{
    Task<int> AddAsync(Notification notification);
    Task<List<Notification>> GetByUserIdAsync(int userId);
    Task MarkAsReadAsync(int notificationId, int userId);
    Task<int> GetUnreadCountAsync(int userId);
}
