using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.ToggleHideRating;

public class ToggleHideRatingHandler : IRequestHandler<ToggleHideRatingCommand, bool>
{
    private readonly IRatingRepository _ratingRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public ToggleHideRatingHandler(IRatingRepository ratingRepository, IWarehouseRepository warehouseRepository)
    {
        _ratingRepository = ratingRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<bool> Handle(ToggleHideRatingCommand request, CancellationToken cancellationToken)
    {
        var rating = await _ratingRepository.GetByIdAsync(request.RatingId, cancellationToken);
        if (rating == null)
            throw new InvalidOperationException("Không tìm thấy đánh giá.");

        // Owner can hide ratings on their warehouse
        if (!request.IsAdmin)
        {
            var ownerId = await _warehouseRepository.FindWarehouseOwnerById(rating.WarehouseId, cancellationToken);
            if (ownerId != request.CallerId)
                throw new UnauthorizedAccessException("Bạn không có quyền ẩn đánh giá này.");
        }

        rating.IsHidden = !(rating.IsHidden ?? false);
        rating.UpdatedAt = DateTime.UtcNow;

        await _ratingRepository.UpdateAsync(rating, cancellationToken);
        return rating.IsHidden ?? false;
    }
}
