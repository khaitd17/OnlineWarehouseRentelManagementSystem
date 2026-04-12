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
            IsActive = request.IsActive
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

        if (package.Name != request.Name && await _db.SubscriptionPackages.AnyAsync(p => p.Name == request.Name, cancellationToken))
            return ApiResponse<bool>.ErrorResponse("Gói cước với tên này đã tồn tại.");

        package.Name = request.Name;
        package.Price = request.Price;
        package.Description = request.Description;
        package.DurationMonths = request.DurationMonths;
        package.IsActive = request.IsActive;
        package.UpdatedAt = System.DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Cập nhật gói cước thành công.");
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
