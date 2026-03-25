using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Ratings.GetWarehouseRatings;

public class GetWarehouseRatingsHandler : IRequestHandler<GetWarehouseRatingsQuery, WarehouseRatingsDto>
{
    private readonly IRatingRepository _ratingRepository;

    public GetWarehouseRatingsHandler(IRatingRepository ratingRepository)
    {
        _ratingRepository = ratingRepository;
    }

    public async Task<WarehouseRatingsDto> Handle(GetWarehouseRatingsQuery request, CancellationToken cancellationToken)
    {
        var ratings = await _ratingRepository.GetByWarehouseIdAsync(request.WarehouseId, cancellationToken);

        var visibleRatings = ratings.Where(r => r.IsHidden != true).ToList();
        var starDistribution = new int[5];
        foreach (var r in visibleRatings)
        {
            if (r.Star >= 1 && r.Star <= 5)
                starDistribution[r.Star - 1]++;
        }

        return new WarehouseRatingsDto
        {
            AverageStar = visibleRatings.Any() ? Math.Round(visibleRatings.Average(r => r.Star), 1) : 0,
            TotalCount = visibleRatings.Count,
            StarDistribution = starDistribution,
            Ratings = visibleRatings.Select(r => new RatingItemDto
            {
                RatingId = r.RatingId,
                WarehouseId = r.WarehouseId,
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
            }).ToList()
        };
    }
}
