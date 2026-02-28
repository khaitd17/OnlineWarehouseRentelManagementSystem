using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetOwners;

public class GetOwnersQuery : IRequest<ApiResponse<List<OwnerDto>>>
{
}
