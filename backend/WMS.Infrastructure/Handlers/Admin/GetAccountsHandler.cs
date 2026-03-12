using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetAccounts;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetAccountsHandler : IRequestHandler<GetAccountsQuery, ApiResponse<PagedResult<AccountDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetAccountsHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PagedResult<AccountDto>>> Handle(GetAccountsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Users.Include(u => u.Role).AsQueryable();

        // --- Search ---
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                (u.Phone != null && u.Phone.Contains(search)));
        }

        // --- Filter by Status ---
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(u => u.Status == request.Status.ToUpper());
        }

        // --- Filter by RoleId ---
        if (request.RoleId.HasValue)
        {
            query = query.Where(u => u.RoleId == request.RoleId.Value);
        }

        // --- Sort ---
        query = request.SortBy?.ToLower() switch
        {
            "fullname" => request.SortOrder.ToLower() == "desc"
                ? query.OrderByDescending(u => u.FullName)
                : query.OrderBy(u => u.FullName),
            "email" => request.SortOrder.ToLower() == "desc"
                ? query.OrderByDescending(u => u.Email)
                : query.OrderBy(u => u.Email),
            "status" => request.SortOrder.ToLower() == "desc"
                ? query.OrderByDescending(u => u.Status)
                : query.OrderBy(u => u.Status),
            "createdat" => request.SortOrder.ToLower() == "desc"
                ? query.OrderByDescending(u => u.CreatedAt)
                : query.OrderBy(u => u.CreatedAt),
            "lastloginat" => request.SortOrder.ToLower() == "desc"
                ? query.OrderByDescending(u => u.LastLoginAt)
                : query.OrderBy(u => u.LastLoginAt),
            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AccountDto(
                u.UserId, u.FullName, u.Email, u.Phone, u.AvatarUrl,
                u.Status, u.Role.RoleName, u.CreatedAt, u.LastLoginAt
            ))
            .ToListAsync(cancellationToken);

        var result = new PagedResult<AccountDto>
        {
            Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize
        };

        return ApiResponse<PagedResult<AccountDto>>.SuccessResponse(result, "Lấy danh sách tài khoản thành công.");
    }
}
