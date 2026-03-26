using MediatR;
using WMS.Application.Features.Ratings.GetWarehouseRatings;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.GetMyRatings;

public class GetMyRatingsHandler : IRequestHandler<GetMyRatingsQuery, List<RatingItemDto>>
{
    private readonly IRatingRepository _ratingRepository;

    public GetMyRatingsHandler(IRatingRepository ratingRepository)
    {
        _ratingRepository = ratingRepository;
    }

    public async Task<List<RatingItemDto>> Handle(GetMyRatingsQuery request, CancellationToken cancellationToken)
    {
        var ratings = await _ratingRepository.GetByRenterIdAsync(request.RenterId, cancellationToken);

        return ratings.Select(r => new RatingItemDto
        {
            RatingId       = r.RatingId,
            WarehouseId    = r.WarehouseId,
            WarehouseName  = r.Warehouse?.Name,
            RenterId       = r.RenterId,
            ContractId     = r.ContractId,
            ContractNumber = r.Contract?.ContractNumber,
            Star           = r.Star,
            Comment        = r.Comment,
            IsHidden       = r.IsHidden ?? false,
            OwnerReply     = r.OwnerReply,
            RepliedAt      = r.RepliedAt,
            CreatedAt      = r.CreatedAt,
            UpdatedAt      = r.UpdatedAt,
        }).ToList();
    }
}
