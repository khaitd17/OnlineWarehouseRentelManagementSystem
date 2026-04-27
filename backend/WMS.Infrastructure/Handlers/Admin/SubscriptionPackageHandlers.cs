using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.SubscriptionPackages;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetSubscriptionPackagesHandler : IRequestHandler<GetSubscriptionPackagesQuery, ApiResponse<IEnumerable<SubscriptionPackage>>>
{
    private readonly ApplicationDbContext _db;

    public GetSubscriptionPackagesHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IEnumerable<SubscriptionPackage>>> Handle(GetSubscriptionPackagesQuery request, CancellationToken cancellationToken)
    {
        var packages = await _db.SubscriptionPackages.OrderBy(p => p.Price).ToListAsync(cancellationToken);
        return ApiResponse<IEnumerable<SubscriptionPackage>>.SuccessResponse(packages);
    }
}

public class CreateSubscriptionPackageHandler : IRequestHandler<CreateSubscriptionPackageCommand, ApiResponse<SubscriptionPackage>>
{
    private readonly ApplicationDbContext _db;

    public CreateSubscriptionPackageHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<SubscriptionPackage>> Handle(CreateSubscriptionPackageCommand request, CancellationToken cancellationToken)
    {
        if (await _db.SubscriptionPackages.AnyAsync(p => p.Name == request.Name, cancellationToken))
            return ApiResponse<SubscriptionPackage>.ErrorResponse("Gói cước với tên này đã tồn tại.");

        var package = new SubscriptionPackage
        {
            Name = request.Name,
            Price = request.Price,
            Description = request.Description,
            DurationMonths = request.DurationMonths,
            IsActive = request.IsActive,
            MaxWarehouses = request.MaxWarehouses,
            MaxStaffPerWarehouse = request.MaxStaffPerWarehouse,
            MaxZonesPerWarehouse = request.MaxZonesPerWarehouse,
            MaxTotalArea = request.MaxTotalArea,
            AllowEquipmentManagement = request.AllowEquipmentManagement
        };

        _db.SubscriptionPackages.Add(package);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<SubscriptionPackage>.SuccessResponse(package, "Tạo gói cước thành công.");
    }
}

public class UpdateSubscriptionPackageHandler : IRequestHandler<UpdateSubscriptionPackageCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public UpdateSubscriptionPackageHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateSubscriptionPackageCommand request, CancellationToken cancellationToken)
    {
        var package = await _db.SubscriptionPackages.FindAsync(new object[] { request.PackageId }, cancellationToken);
        if (package == null)
            return ApiResponse<bool>.ErrorResponse("Không tìm thấy gói cước.");

        var oldName = package.Name;
        bool nameChanged = oldName != request.Name;

        if (nameChanged && await _db.SubscriptionPackages.AnyAsync(p => p.Name == request.Name, cancellationToken))
            return ApiResponse<bool>.ErrorResponse("Gói cước với tên này đã tồn tại.");

        bool hasSubscribers = await _db.Subscriptions.AnyAsync(s => s.Plan == package.Name, cancellationToken);
        if (hasSubscribers && request.Price != package.Price)
            return ApiResponse<bool>.ErrorResponse("Không thể thay đổi giá gói cước khi đã có người đăng ký. Hãy tạo gói mới nếu muốn thay đổi giá.");

        // Cascade update all subscriptions that stored the old package name
        if (nameChanged)
        {
            var affectedSubs = await _db.Subscriptions
                .Where(s => s.Plan == oldName)
                .ToListAsync(cancellationToken);
            foreach (var sub in affectedSubs)
                sub.Plan = request.Name;
        }

        package.Name = request.Name;
        package.Price = request.Price;
        package.Description = request.Description;
        package.DurationMonths = request.DurationMonths;
        package.IsActive = request.IsActive;
        package.MaxWarehouses = request.MaxWarehouses;
        package.MaxStaffPerWarehouse = request.MaxStaffPerWarehouse;
        package.MaxZonesPerWarehouse = request.MaxZonesPerWarehouse;
        package.MaxTotalArea = request.MaxTotalArea;
        package.AllowEquipmentManagement = request.AllowEquipmentManagement;
        package.UpdatedAt = System.DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        var affectedCount = nameChanged
            ? await _db.Subscriptions.CountAsync(s => s.Plan == request.Name, cancellationToken)
            : 0;
        var msg = nameChanged && affectedCount > 0
            ? $"Cập nhật gói cước thành công. Đã cập nhật tên cho {affectedCount} đăng ký đang dùng gói này."
            : "Cập nhật gói cước thành công.";

        return ApiResponse<bool>.SuccessResponse(true, msg);
    }
}

public class DeleteSubscriptionPackageHandler : IRequestHandler<DeleteSubscriptionPackageCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public DeleteSubscriptionPackageHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteSubscriptionPackageCommand request, CancellationToken cancellationToken)
    {
        var package = await _db.SubscriptionPackages.FindAsync(new object[] { request.PackageId }, cancellationToken);
        if (package == null)
            return ApiResponse<bool>.ErrorResponse("Không tìm thấy gói cước.");

        // Có thể cần check xem gói này đã có người đăng ký chưa trước khi xoá thực tế
        bool inUse = await _db.Subscriptions.AnyAsync(s => s.Plan == package.Name, cancellationToken);
        if (inUse)
            return ApiResponse<bool>.ErrorResponse("Không thể xóa gói cước đang có người sử dụng. Hãy chuyển trạng thái IsActive sang false.");

        _db.SubscriptionPackages.Remove(package);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Xóa gói cước thành công.");
    }
}
