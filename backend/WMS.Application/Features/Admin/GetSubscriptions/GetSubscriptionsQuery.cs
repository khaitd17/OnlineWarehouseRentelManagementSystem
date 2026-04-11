using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetSubscriptions;

public class GetSubscriptionsQuery : PaginationParams, IRequest<ApiResponse<PagedResult<SubscriptionDto>>>
{
    public string? Status { get; set; }
    public string? Plan { get; set; }
}

public class SubscriptionDto
{
    public int SubscriptionId { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Plan { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? TransactionReference { get; set; }
}
