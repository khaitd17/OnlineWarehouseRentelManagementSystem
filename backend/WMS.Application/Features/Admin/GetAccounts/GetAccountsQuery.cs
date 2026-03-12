using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetAccounts;

public class GetAccountsQuery : IRequest<ApiResponse<PagedResult<AccountDto>>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public string SortOrder { get; set; } = "asc";
    public string? Search { get; set; }
    public string? Status { get; set; }
    public int? RoleId { get; set; }
}

public record AccountDto(
    int UserId,
    string FullName,
    string Email,
    string? Phone,
    string? AvatarUrl,
    string? Status,
    string RoleName,
    DateTime? CreatedAt,
    DateTime? LastLoginAt
);
