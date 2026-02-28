using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Entities;
using System.Linq.Dynamic.Core;

namespace WMS.Application.Features.Admin.Queries.GetUsers;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, ApiResponse<PaginatedList<UserDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PaginatedList<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users.Include(u => u.Role).AsQueryable();

        // Search
        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(u => u.FullName.Contains(request.Search) || u.Email.Contains(request.Search));
        }

        if (request.ExcludeUserId.HasValue)
        {
            query = query.Where(u => u.UserId != request.ExcludeUserId.Value);
        }

        // Sorting
        if (!string.IsNullOrEmpty(request.SortBy))
        {
            var orderDirection = request.IsAscending ? "ascending" : "descending";
            // Note: System.Linq.Dynamic.Core is needed for this string-based sorting
            query = query.OrderBy($"{request.SortBy} {orderDirection}");
        }
        else
        {
            query = query.OrderByDescending(u => u.CreatedAt);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UserDto(
                u.UserId,
                u.FullName,
                u.Email,
                u.Phone ?? string.Empty,
                u.Role.RoleName,
                u.Status ?? "ACTIVE",
                u.CreatedAt ?? DateTime.MinValue
            ))
            .ToListAsync(cancellationToken);

        var paginatedList = new PaginatedList<UserDto>(items, totalCount, request.PageNumber, request.PageSize);
        return ApiResponse<PaginatedList<UserDto>>.SuccessResult(paginatedList);
    }
}
