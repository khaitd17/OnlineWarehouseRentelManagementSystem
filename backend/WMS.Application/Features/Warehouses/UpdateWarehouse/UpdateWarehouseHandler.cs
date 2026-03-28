using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.UpdateWarehouse;

public class UpdateWarehouseHandler : IRequestHandler<UpdateWarehouseCommand>
{
    private readonly IWarehouseRepository _repository;

    public UpdateWarehouseHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _repository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new Exception("Warehouse not found");

        if (warehouse.OwnerId != request.OwnerId)
            throw new UnauthorizedAccessException("You are not the owner");

        // Maintain current occupancy by recalculating available area
        var rentedArea = warehouse.TotalArea - warehouse.AvailableArea;

        // ── Business rule: price change on an APPROVED warehouse requires re-approval ──
        // Compare incoming price with existing price (handle null on both sides)
        var incomingPrice = request.PricePerM2;
        var currentPrice  = warehouse.PricePerM2;
        var priceChanged  = incomingPrice.HasValue && incomingPrice != currentPrice;

        warehouse.Name             = request.Name;
        warehouse.Address          = request.Address;
        warehouse.Lat              = request.Lat;
        warehouse.Lng              = request.Lng;
        warehouse.Description      = request.Description;
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

        // ── Key check: warehouse has EVER been approved (ApprovedAt is set) ──
        // Using ApprovedAt instead of Status == "APPROVED" because the warehouse
        // may already be PENDING (e.g. second price change), yet it was previously approved.
        var wasEverApproved = warehouse.ApprovedAt.HasValue;

        if (priceChanged && wasEverApproved)
        {
            // Revert to PENDING so admin must review the new price
            warehouse.Status            = "PENDING";
            warehouse.SubmissionType    = "PRICE_UPDATE";
            warehouse.PendingChangeNote = $"Yêu cầu thay đổi giá: {currentPrice:N0} → {incomingPrice:N0} ₫/m²";
        }
        else
        {
            // Normal save: no price change, or brand-new warehouse never approved before
            warehouse.Status            = request.Status ?? warehouse.Status;
            warehouse.SubmissionType    = "NEW";
            warehouse.PendingChangeNote = null;
        }


        await _repository.UpdateAsync(warehouse, cancellationToken);
    }
}