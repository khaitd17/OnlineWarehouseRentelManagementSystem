using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.UpdateSubscription;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Handlers.Admin;

public class UpdateSubscriptionHandler : IRequestHandler<UpdateSubscriptionCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public UpdateSubscriptionHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriptionId == request.SubscriptionId, cancellationToken);

        if (subscription == null)
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy gói cước với ID {request.SubscriptionId}.");

        // Update plan
        if (!string.IsNullOrWhiteSpace(request.Plan))
        {
            var exists = await _db.SubscriptionPackages.AnyAsync(p => p.Name == request.Plan, cancellationToken);
            if (exists)
                subscription.Plan = request.Plan;
            else
                return ApiResponse<bool>.ErrorResponse($"Gói cước không hợp lệ hoặc không tồn tại: {request.Plan}.");
        }

        // Update status
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (Enum.TryParse<SubscriptionStatus>(request.Status, true, out var status))
                subscription.Status = status;
            else
                return ApiResponse<bool>.ErrorResponse($"Trạng thái không hợp lệ: {request.Status}. Chấp nhận: Pending, Active, Expired, Cancelled.");
        }

        // Update dates
        if (request.StartDate.HasValue)
            subscription.StartDate = request.StartDate.Value;
        if (request.EndDate.HasValue)
            subscription.EndDate = request.EndDate.Value;

        // Validate dates
        if (subscription.StartDate.HasValue && subscription.EndDate.HasValue && subscription.EndDate < subscription.StartDate)
            return ApiResponse<bool>.ErrorResponse("Ngày kết thúc phải sau ngày bắt đầu.");

        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Cập nhật gói cước thành công.");
    }
}
