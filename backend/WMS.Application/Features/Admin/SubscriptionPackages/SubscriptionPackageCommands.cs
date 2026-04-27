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
    public int MaxWarehouses { get; set; } = 1;
    public int MaxStaffPerWarehouse { get; set; } = 5;
    public int MaxZonesPerWarehouse { get; set; } = 3;
    public decimal MaxTotalArea { get; set; } = 500;
    public bool AllowEquipmentManagement { get; set; } = false;
}

public class UpdateSubscriptionPackageCommand : IRequest<ApiResponse<bool>>
{
    public int PackageId { get; set; }
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int DurationMonths { get; set; }
    public bool IsActive { get; set; }
    public int MaxWarehouses { get; set; } = 1;
    public int MaxStaffPerWarehouse { get; set; } = 5;
    public int MaxZonesPerWarehouse { get; set; } = 3;
    public decimal MaxTotalArea { get; set; } = 500;
    public bool AllowEquipmentManagement { get; set; } = false;
}

public class DeleteSubscriptionPackageCommand : IRequest<ApiResponse<bool>>
{
    public int PackageId { get; set; }
    public DeleteSubscriptionPackageCommand(int id) => PackageId = id;
}
