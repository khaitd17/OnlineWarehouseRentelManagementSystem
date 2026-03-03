using MediatR;

namespace WMS.Application.Features.RentalRequests.CreateRentalRequest;

public record CreateRentalRequestCommand(
    int RenterId,
    int WarehouseId,
    double RequestedArea,
    int DurationMonths,
    string? Notes
) : IRequest<int>;
