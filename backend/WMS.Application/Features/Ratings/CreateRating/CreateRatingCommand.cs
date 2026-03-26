using MediatR;

namespace WMS.Application.Features.Ratings.CreateRating;

public class CreateRatingCommand : IRequest<int>
{
    public int RenterId { get; set; }
    public int WarehouseId { get; set; }
    public int? ContractId { get; set; }
    public int Star { get; set; }
    public string? Comment { get; set; }
}
