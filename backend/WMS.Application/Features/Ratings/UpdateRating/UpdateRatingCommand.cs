using MediatR;

namespace WMS.Application.Features.Ratings.UpdateRating;

public class UpdateRatingCommand : IRequest<bool>
{
    public int RatingId { get; set; }
    public int CallerId { get; set; }
    public int Star { get; set; }
    public string? Comment { get; set; }
}
