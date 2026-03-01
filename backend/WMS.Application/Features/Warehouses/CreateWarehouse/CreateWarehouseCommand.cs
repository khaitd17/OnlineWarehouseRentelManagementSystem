using MediatR;

namespace WMS.Application.Features.Warehouses.CreateWarehouse;

public record CreateWarehouseCommand(
    string Name,
    string Description,
    string Address,
    string City,
    string Province,
    double Area,
    decimal PricePerMonth,
    string WarehouseType,
    int Capacity,
    int OwnerId
) : IRequest<int>;