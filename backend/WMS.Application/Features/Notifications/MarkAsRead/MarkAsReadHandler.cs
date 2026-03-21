using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Notifications.MarkAsRead;

public class MarkAsReadHandler : IRequestHandler<MarkAsReadCommand, Unit>
{
    private readonly INotificationRepository _notificationRepository;

    public MarkAsReadHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<Unit> Handle(MarkAsReadCommand request, CancellationToken cancellationToken)
    {
        await _notificationRepository.MarkAsReadAsync(request.NotificationId, request.UserId);
        return Unit.Value;
    }
}
