using MediatR;

namespace WMS.Application.Features.Ratings.ReplyToRating;

public class ReplyToRatingCommand : IRequest<bool>
{
    public int RatingId { get; set; }
    public int OwnerId { get; set; }
    public string Reply { get; set; } = null!;
}
