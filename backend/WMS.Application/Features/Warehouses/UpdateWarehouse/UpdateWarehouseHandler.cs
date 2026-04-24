using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.UpdateWarehouse;

public class UpdateWarehouseHandler : IRequestHandler<UpdateWarehouseCommand>
{
    private readonly IWarehouseRepository _repository;
    private readonly ISubscriptionService _subscriptionService;

    public UpdateWarehouseHandler(
        IWarehouseRepository repository,
        ISubscriptionService subscriptionService)
    {
        _repository = repository;
        _subscriptionService = subscriptionService;
    }

    public async Task Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        // Kiểm tra xem gói dịch vụ còn hạn không (Read-only mode)
        if (!await _subscriptionService.IsSubscriptionActiveAsync(request.OwnerId))
        {
            throw new Exception("Gói dịch vụ của bạn đã hết hạn. Bạn không thể chỉnh sửa thông tin kho cho đến khi gia hạn.");
        }

        var warehouse = await _repository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new Exception("Warehouse not found");

        if (warehouse.OwnerId != request.OwnerId)
            throw new UnauthorizedAccessException("You are not the owner");

        // Maintain current occupancy by recalculating available area
        var rentedArea = warehouse.TotalArea - warehouse.AvailableArea;

        var incomingPrice = request.PricePerM2;
        var currentPrice  = warehouse.PricePerM2;

        warehouse.Name             = request.Name;
        warehouse.Address          = request.Address;
        warehouse.Lat              = request.Lat;
        warehouse.Lng              = request.Lng;
        warehouse.Description      = request.Description;
        warehouse.WarehouseType    = request.WarehouseType;
        warehouse.OperatingHours   = request.OperatingHours;
        warehouse.Is24HoursAccess  = request.Is24HoursAccess;
        warehouse.OpenTime         = request.OpenTime;
        warehouse.CloseTime        = request.CloseTime;
        warehouse.TotalArea        = request.TotalArea;
        warehouse.Width            = request.Width;
        warehouse.Length           = request.Length;
        warehouse.AvailableArea    = request.TotalArea - rentedArea;
        warehouse.MainDoorDirection = request.MainDoorDirection;
        warehouse.PricePerM2       = incomingPrice ?? currentPrice;

        // Price changes no longer require admin re-approval – save directly
        warehouse.Status            = request.Status ?? warehouse.Status;
        warehouse.SubmissionType    = "NEW";
        warehouse.PendingChangeNote = null;


        await _repository.UpdateAsync(warehouse, cancellationToken);
    }
}