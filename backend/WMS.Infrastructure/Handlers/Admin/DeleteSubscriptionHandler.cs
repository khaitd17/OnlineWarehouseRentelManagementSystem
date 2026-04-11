using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.DeleteSubscription;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Handlers.Admin;

public class DeleteSubscriptionHandler : IRequestHandler<DeleteSubscriptionCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public DeleteSubscriptionHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriptionId == request.SubscriptionId, cancellationToken);

        if (subscription == null)
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy gói cước với ID {request.SubscriptionId}.");

        _db.Subscriptions.Remove(subscription);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResponse(true, "Đã xóa gói cước thành công.");
    }
}
