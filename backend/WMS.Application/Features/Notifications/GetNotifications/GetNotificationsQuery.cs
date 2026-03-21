using MediatR;
using WMS.Application.Features.Notifications.Common;

namespace WMS.Application.Features.Notifications.GetNotifications;

public class GetNotificationsQuery : IRequest<List<NotificationDto>>
{
    public int UserId { get; set; }
}
