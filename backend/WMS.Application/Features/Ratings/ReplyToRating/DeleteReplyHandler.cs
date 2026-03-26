using MediatR;

namespace WMS.Application.Features.Ratings.ReplyToRating;

public class DeleteReplyCommand : IRequest<bool>
{
    public int RatingId { get; set; }
    public int OwnerId  { get; set; }
}

public class DeleteReplyHandler : IRequestHandler<DeleteReplyCommand, bool>
{
    private readonly WMS.Domain.Interfaces.IRatingRepository _ratingRepository;
    private readonly WMS.Domain.Interfaces.IWarehouseRepository _warehouseRepository;

    public DeleteReplyHandler(
        WMS.Domain.Interfaces.IRatingRepository ratingRepository,
        WMS.Domain.Interfaces.IWarehouseRepository warehouseRepository)
    {
        _ratingRepository    = ratingRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<bool> Handle(DeleteReplyCommand request, CancellationToken cancellationToken)
    {
        var rating = await _ratingRepository.GetByIdAsync(request.RatingId, cancellationToken);
        if (rating == null)
            throw new InvalidOperationException("Không tìm thấy đánh giá.");

        var ownerId = await _warehouseRepository.FindWarehouseOwnerById(rating.WarehouseId, cancellationToken);
        if (ownerId != request.OwnerId)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa phản hồi này.");

        rating.OwnerReply = null;
        rating.RepliedAt  = null;
        rating.UpdatedAt  = DateTime.UtcNow;

        await _ratingRepository.UpdateAsync(rating, cancellationToken);
        return true;
    }
}
