using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.ReplyToRating;

public class ReplyToRatingHandler : IRequestHandler<ReplyToRatingCommand, bool>
{
    private readonly IRatingRepository _ratingRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public ReplyToRatingHandler(IRatingRepository ratingRepository, IWarehouseRepository warehouseRepository)
    {
        _ratingRepository = ratingRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<bool> Handle(ReplyToRatingCommand request, CancellationToken cancellationToken)
    {
        var rating = await _ratingRepository.GetByIdAsync(request.RatingId, cancellationToken);
        if (rating == null)
            throw new InvalidOperationException("Không tìm thấy đánh giá.");

        // Verify caller is the warehouse owner
        var ownerId = await _warehouseRepository.FindWarehouseOwnerById(rating.WarehouseId, cancellationToken);
        if (ownerId != request.OwnerId)
            throw new UnauthorizedAccessException("Bạn không có quyền phản hồi đánh giá này.");

        if (string.IsNullOrWhiteSpace(request.Reply))
            throw new InvalidOperationException("Nội dung phản hồi không được để trống.");

        rating.OwnerReply = request.Reply;
        rating.RepliedAt = DateTime.UtcNow;
        rating.UpdatedAt = DateTime.UtcNow;

        await _ratingRepository.UpdateAsync(rating, cancellationToken);
        return true;
    }
}
