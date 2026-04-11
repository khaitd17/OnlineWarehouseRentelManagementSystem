using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetSubscriptions;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetSubscriptionsHandler : IRequestHandler<GetSubscriptionsQuery, ApiResponse<PagedResult<SubscriptionDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetSubscriptionsHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PagedResult<SubscriptionDto>>> Handle(GetSubscriptionsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Subscriptions
            .Include(s => s.User)
            .AsQueryable();

        // Filter by status
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(s => s.Status.ToString() == request.Status);
        }

        // Filter by plan
        if (!string.IsNullOrWhiteSpace(request.Plan))
        {
            query = query.Where(s => s.Plan.ToString() == request.Plan);
        }

        // Search by user name, email
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(s =>
                s.User.FullName.ToLower().Contains(search) ||
                s.User.Email.ToLower().Contains(search) ||
                (s.TransactionReference != null && s.TransactionReference.ToLower().Contains(search))
            );
        }

        // Sorting
        var sortBy = (request.SortBy ?? "subscriptionId").ToLower();
        var isDesc = (request.SortOrder ?? "desc").ToLower() == "desc";

        query = sortBy switch
        {
            "fullname" => isDesc ? query.OrderByDescending(s => s.User.FullName) : query.OrderBy(s => s.User.FullName),
            "email" => isDesc ? query.OrderByDescending(s => s.User.Email) : query.OrderBy(s => s.User.Email),
            "plan" => isDesc ? query.OrderByDescending(s => s.Plan) : query.OrderBy(s => s.Plan),
            "status" => isDesc ? query.OrderByDescending(s => s.Status) : query.OrderBy(s => s.Status),
            "startdate" => isDesc ? query.OrderByDescending(s => s.StartDate) : query.OrderBy(s => s.StartDate),
            "enddate" => isDesc ? query.OrderByDescending(s => s.EndDate) : query.OrderBy(s => s.EndDate),
            _ => isDesc ? query.OrderByDescending(s => s.SubscriptionId) : query.OrderBy(s => s.SubscriptionId),
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new SubscriptionDto
            {
                SubscriptionId = s.SubscriptionId,
                UserId = s.UserId,
                FullName = s.User.FullName,
                Email = s.User.Email,
                Phone = s.User.Phone ?? "",
                Plan = s.Plan.ToString(),
                Status = s.Status.ToString(),
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                TransactionReference = s.TransactionReference
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<PagedResult<SubscriptionDto>>.SuccessResponse(new PagedResult<SubscriptionDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        });
    }
}
