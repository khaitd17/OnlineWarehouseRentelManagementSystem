using MediatR;

namespace WMS.Application.Features.Ratings.GetWarehouseRatings;

public class GetWarehouseRatingsQuery : IRequest<WarehouseRatingsDto>
{
    public int WarehouseId { get; set; }
}

public class WarehouseRatingsDto
{
    public double AverageStar { get; set; }
    public int TotalCount { get; set; }
    public int[] StarDistribution { get; set; } = new int[5]; // index 0=1star, 4=5star
    public List<RatingItemDto> Ratings { get; set; } = new();
}

public class RatingItemDto
{
    public int RatingId { get; set; }
    public int WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public int RenterId { get; set; }
    public string? RenterName { get; set; }
    public string? RenterAvatar { get; set; }
    public int? ContractId { get; set; }
    public string? ContractNumber { get; set; }
    public int Star { get; set; }
    public string? Comment { get; set; }
    public bool IsHidden { get; set; }
    public string? OwnerReply { get; set; }
    public DateTime? RepliedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
