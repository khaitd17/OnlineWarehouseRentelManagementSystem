using System.Collections.Generic;
using MediatR;
using WMS.Application.Common;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Admin.SubscriptionPackages;

public class GetSubscriptionPackagesQuery : IRequest<ApiResponse<IEnumerable<SubscriptionPackage>>>
{
}

public class CreateSubscriptionPackageCommand : IRequest<ApiResponse<SubscriptionPackage>>
{
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int DurationMonths { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateSubscriptionPackageCommand : IRequest<ApiResponse<bool>>
{
    public int PackageId { get; set; }
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int DurationMonths { get; set; }
    public bool IsActive { get; set; }
}

public class DeleteSubscriptionPackageCommand : IRequest<ApiResponse<bool>>
{
    public int PackageId { get; set; }
    public DeleteSubscriptionPackageCommand(int id) => PackageId = id;
}
