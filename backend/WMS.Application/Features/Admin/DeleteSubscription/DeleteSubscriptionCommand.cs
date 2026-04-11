using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.DeleteSubscription;

public class DeleteSubscriptionCommand : IRequest<ApiResponse<bool>>
{
    public int SubscriptionId { get; set; }

    public DeleteSubscriptionCommand(int subscriptionId)
    {
        SubscriptionId = subscriptionId;
    }
}
