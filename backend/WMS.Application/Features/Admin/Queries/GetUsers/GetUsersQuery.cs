using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetUsers;

public record GetUsersQuery(int? ExcludeUserId = null) : PaginationParams, IRequest<ApiResponse<PaginatedList<UserDto>>>;

public record UserDto(
    int UserId,
    string FullName,
    string Email,
    string? Phone,
    string RoleName,
    string Status,
    DateTime CreatedAt
);
