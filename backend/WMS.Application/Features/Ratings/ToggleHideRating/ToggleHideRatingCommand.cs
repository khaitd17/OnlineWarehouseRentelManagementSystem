using MediatR;

namespace WMS.Application.Features.Ratings.ToggleHideRating;

public class ToggleHideRatingCommand : IRequest<bool>
{
    public int RatingId { get; set; }
    public int CallerId { get; set; }
    public bool IsAdmin { get; set; }
}
