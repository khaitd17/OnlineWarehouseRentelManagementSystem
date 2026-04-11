using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.UpdateSubscription;

public class UpdateSubscriptionCommand : IRequest<ApiResponse<bool>>
{
    public int SubscriptionId { get; set; }
    public string? Plan { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
