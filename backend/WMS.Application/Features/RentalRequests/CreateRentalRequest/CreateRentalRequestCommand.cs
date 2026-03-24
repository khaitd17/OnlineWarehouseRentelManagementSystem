using MediatR;

namespace WMS.Application.Features.RentalRequests.CreateRentalRequest;

public class CreateRentalRequestCommand : IRequest<int>
{
    public int RenterId { get; set; }
    public int WarehouseId { get; set; }
    public int? RentalAreaId { get; set; }
    public double RequestedArea { get; set; }
    public DateTime StartDate { get; set; }
    public int DurationMonths { get; set; }
    public string? Notes { get; set; }
}
