using MediatR;
using WMS.Application.Features.Ratings.GetWarehouseRatings;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.GetWarehouseRatings;

public class GetAllRatingsQuery : IRequest<List<RatingItemDto>> { }

public class GetAllRatingsHandler : IRequestHandler<GetAllRatingsQuery, List<RatingItemDto>>
{
    private readonly IRatingRepository _ratingRepository;

    public GetAllRatingsHandler(IRatingRepository ratingRepository)
    {
        _ratingRepository = ratingRepository;
    }

    public async Task<List<RatingItemDto>> Handle(GetAllRatingsQuery request, CancellationToken cancellationToken)
    {
        var ratings = await _ratingRepository.GetAllAsync(cancellationToken);

        return ratings.Select(r => new RatingItemDto
        {
            RatingId = r.RatingId,
            WarehouseId = r.WarehouseId,
            WarehouseName = r.Warehouse?.Name,
            RenterId = r.RenterId,
            RenterName = r.Renter?.FullName,
            RenterAvatar = r.Renter?.AvatarUrl,
            ContractId = r.ContractId,
            ContractNumber = r.Contract?.ContractNumber,
            Star = r.Star,
            Comment = r.Comment,
            IsHidden = r.IsHidden ?? false,
            OwnerReply = r.OwnerReply,
            RepliedAt = r.RepliedAt,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();
    }
}
