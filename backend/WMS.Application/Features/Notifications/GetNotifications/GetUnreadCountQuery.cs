using MediatR;

namespace WMS.Application.Features.Notifications.GetNotifications;

public class GetUnreadCountQuery : IRequest<int>
{
    public int UserId { get; set; }
}
