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

        // ── Module 1: Business Validation (Update) ──────────────────────────
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tên kho không được để trống.");
        if (request.Name.Trim().Length < 2 || request.Name.Trim().Length > 150)
            throw new ArgumentException("Tên kho phải từ 2 đến 150 ký tự.");

        if (string.IsNullOrWhiteSpace(request.Address))
            throw new ArgumentException("Địa chỉ không được để trống.");
        if (request.Address.Trim().Length < 10 || request.Address.Trim().Length > 300)
            throw new ArgumentException("Địa chỉ phải từ 10 đến 300 ký tự.");

        if (request.TotalArea <= 0)
            throw new ArgumentException("Tổng thể tích kho phải lớn hơn 0.");
        if (request.TotalArea > 500_000)
            throw new ArgumentException("Tổng thể tích kho không được vượt quá 500,000 m³.");

        // Không được giảm thể tích xuống dưới phần đã cho thuê
        var rentedArea = warehouse.TotalArea - warehouse.AvailableArea;
        if (request.TotalArea < rentedArea)
            throw new ArgumentException($"Không thể giảm thể tích xuống {request.TotalArea} m³ vì đã có {rentedArea} m³ đang được cho thuê.");

        if (request.Width.HasValue && request.Width.Value <= 0)
            throw new ArgumentException("Chiều rộng kho phải lớn hơn 0.");
        if (request.Length.HasValue && request.Length.Value <= 0)
            throw new ArgumentException("Chiều dài kho phải lớn hơn 0.");

        if (request.Lat.HasValue && (request.Lat.Value < -90 || request.Lat.Value > 90))
            throw new ArgumentException("Vĩ độ (Lat) phải nằm trong khoảng [-90, 90].");
        if (request.Lng.HasValue && (request.Lng.Value < -180 || request.Lng.Value > 180))
            throw new ArgumentException("Kinh độ (Lng) phải nằm trong khoảng [-180, 180].");

        if (!request.Is24HoursAccess)
        {
            if (!request.OpenTime.HasValue || !request.CloseTime.HasValue)
                throw new ArgumentException("Vui lòng nhập giờ mở cửa và giờ đóng cửa khi kho không hoạt động 24/7.");
            if (request.OpenTime.Value >= request.CloseTime.Value)
                throw new ArgumentException("Giờ mở cửa phải nhỏ hơn giờ đóng cửa.");
        }

        if (request.PricePerM2.HasValue)
        {
            if (request.PricePerM2.Value < 0)
                throw new ArgumentException("Giá thuê không được âm.");
            if (request.PricePerM2.Value > 100_000_000_000)
                throw new ArgumentException("Giá thuê không được vượt quá 100 tỷ đồng/m³/tháng.");
        }

        if (!string.IsNullOrEmpty(request.Description) && request.Description.Length > 2000)
            throw new ArgumentException("Mô tả kho không được vượt quá 2000 ký tự.");
        // ──────────────────────────────────────────────────────────────────────

        // Maintain current occupancy by recalculating available area
        // (rentedArea already computed above in validation block)

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