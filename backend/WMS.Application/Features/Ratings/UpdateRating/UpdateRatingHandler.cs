using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.UpdateRating;

public class UpdateRatingHandler : IRequestHandler<UpdateRatingCommand, bool>
{
    private readonly IRatingRepository _ratingRepository;

    public UpdateRatingHandler(IRatingRepository ratingRepository)
    {
        _ratingRepository = ratingRepository;
    }

    public async Task<bool> Handle(UpdateRatingCommand request, CancellationToken cancellationToken)
    {
        var rating = await _ratingRepository.GetByIdAsync(request.RatingId, cancellationToken);
        if (rating == null)
            throw new InvalidOperationException("Không tìm thấy đánh giá.");

        if (rating.RenterId != request.CallerId)
            throw new UnauthorizedAccessException("Bạn không có quyền sửa đánh giá này.");

        if (request.Star < 1 || request.Star > 5)
            throw new InvalidOperationException("Số sao phải từ 1 đến 5.");

        rating.Star = request.Star;
        rating.Comment = request.Comment;
        rating.UpdatedAt = DateTime.UtcNow;

        await _ratingRepository.UpdateAsync(rating, cancellationToken);
        return true;
    }
}
