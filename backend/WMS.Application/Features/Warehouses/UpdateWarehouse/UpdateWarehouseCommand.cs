using MediatR;

namespace WMS.Application.Features.Warehouses.UpdateWarehouse;

public class UpdateWarehouseCommand : IRequest
{
    public int WarehouseId { get; set; }

    public int OwnerId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public double? Lat { get; set; }

    public double? Lng { get; set; }

    public string? Description { get; set; }

    public string? OperatingHours { get; set; }

    public bool Is24HoursAccess { get; set; }

    public TimeSpan? OpenTime { get; set; }

    public TimeSpan? CloseTime { get; set; }
    public string? MainDoorDirection { get; set; }
    public string? Status { get; set; }
}