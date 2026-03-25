using MediatR;

namespace WMS.Application.Features.Ratings.DeleteRating;

public class DeleteRatingCommand : IRequest<bool>
{
    public int RatingId { get; set; }
    public int CallerId { get; set; }
    public bool IsAdmin { get; set; }
}
