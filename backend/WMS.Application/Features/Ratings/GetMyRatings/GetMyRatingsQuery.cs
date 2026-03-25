using MediatR;
using WMS.Application.Features.Ratings.GetWarehouseRatings;

namespace WMS.Application.Features.Ratings.GetMyRatings;

public class GetMyRatingsQuery : IRequest<List<RatingItemDto>>
{
    public int RenterId { get; set; }
}
