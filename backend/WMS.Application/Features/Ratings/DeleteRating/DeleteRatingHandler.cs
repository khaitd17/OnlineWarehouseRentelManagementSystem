using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.DeleteRating;

public class DeleteRatingHandler : IRequestHandler<DeleteRatingCommand, bool>
{
    private readonly IRatingRepository _ratingRepository;

    public DeleteRatingHandler(IRatingRepository ratingRepository)
    {
        _ratingRepository = ratingRepository;
    }

    public async Task<bool> Handle(DeleteRatingCommand request, CancellationToken cancellationToken)
    {
        var rating = await _ratingRepository.GetByIdAsync(request.RatingId, cancellationToken);
        if (rating == null)
            throw new InvalidOperationException("Không tìm thấy đánh giá.");

        if (!request.IsAdmin && rating.RenterId != request.CallerId)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa đánh giá này.");

        await _ratingRepository.DeleteAsync(request.RatingId, cancellationToken);
        return true;
    }
}
