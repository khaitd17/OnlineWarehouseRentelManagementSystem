using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.CreateWarehouse;

public class CreateWarehouseHandler : IRequestHandler<CreateWarehouseCommand, int>
{
    private readonly IWarehouseRepository _repository;
    private readonly IStaffMembershipRepository _membershipRepository;
    private readonly ISubscriptionService _subscriptionService;

    public CreateWarehouseHandler(
        IWarehouseRepository repository,
        IStaffMembershipRepository membershipRepository,
        ISubscriptionService subscriptionService)
    {
        _repository = repository;
        _membershipRepository = membershipRepository;
        _subscriptionService = subscriptionService;
    }

    public async Task<int> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        // ── Module 1: Business Validation ─────────────────────────────────────
        // Tên kho
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tên kho không được để trống.");
        if (request.Name.Trim().Length < 2 || request.Name.Trim().Length > 150)
            throw new ArgumentException("Tên kho phải từ 2 đến 150 ký tự.");

        // Địa chỉ
        if (string.IsNullOrWhiteSpace(request.Address))
            throw new ArgumentException("Địa chỉ không được để trống.");
        if (request.Address.Trim().Length < 10 || request.Address.Trim().Length > 300)
            throw new ArgumentException("Địa chỉ phải từ 10 đến 300 ký tự.");

        // Diện tích sàn
        if (request.TotalArea <= 0)
            throw new ArgumentException("Diện tích sàn kho phải lớn hơn 0.");
        if (request.TotalArea > 200_000)
            throw new ArgumentException("Diện tích sàn kho không được vượt quá 200,000 m².");

        // Chiều cao kho (bắt buộc)
        if (!request.Height.HasValue || request.Height.Value <= 0)
            throw new ArgumentException("Chiều cao kho phải lớn hơn 0.");
        if (request.Height.Value > 50)
            throw new ArgumentException("Chiều cao kho không được vượt quá 50 m.");

        // Tọa độ GPS
        if (request.Lat.HasValue && (request.Lat.Value < -90 || request.Lat.Value > 90))
            throw new ArgumentException("Vĩ độ (Lat) phải nằm trong khoảng [-90, 90].");
        if (request.Lng.HasValue && (request.Lng.Value < -180 || request.Lng.Value > 180))
            throw new ArgumentException("Kinh độ (Lng) phải nằm trong khoảng [-180, 180].");

        // Giờ hoạt động: nếu không phải 24h thì phải nhập giờ và giờ mở < giờ đóng
        if (!request.Is24HoursAccess)
        {
            if (!request.OpenTime.HasValue || !request.CloseTime.HasValue)
                throw new ArgumentException("Vui lòng nhập giờ mở cửa và giờ đóng cửa khi kho không hoạt động 24/7.");
            if (request.OpenTime.Value >= request.CloseTime.Value)
                throw new ArgumentException("Giờ mở cửa phải nhỏ hơn giờ đóng cửa.");
        }

        // Giá thuê
        if (request.PricePerM2.HasValue)
        {
            if (request.PricePerM2.Value < 0)
                throw new ArgumentException("Giá thuê không được âm.");
            if (request.PricePerM2.Value > 100_000_000_000)
                throw new ArgumentException("Giá thuê không được vượt quá 100 tỷ đồng/m³/tháng.");
        }

        // Mô tả
        if (!string.IsNullOrEmpty(request.Description) && request.Description.Length > 2000)
            throw new ArgumentException("Mô tả kho không được vượt quá 2000 ký tự.");
        // ──────────────────────────────────────────────────────────────────────

        // 1. Kiểm tra giới hạn số lượng kho
        var warehouseLimit = await _subscriptionService.CheckLimitAsync(request.OwnerId, SubscriptionLimitType.WarehouseCount);
        if (!warehouseLimit.IsAllowed)
        {
            throw new Exception(warehouseLimit.Message);
        }

        // 2. Kiểm tra giới hạn tổng diện tích
        var areaLimit = await _subscriptionService.CheckLimitAsync(request.OwnerId, SubscriptionLimitType.TotalArea, (decimal)request.TotalArea);
        if (!areaLimit.IsAllowed)
        {
            throw new Exception(areaLimit.Message);
        }

        var warehouse = new Warehouse
        {
            OwnerId = request.OwnerId,
            Name = request.Name,
            Address = request.Address,
            Lat = request.Lat,
            Lng = request.Lng,
            Description = request.Description,
            WarehouseType = request.WarehouseType,
            TotalArea = request.TotalArea,
            Height = request.Height,
            AvailableArea = request.TotalArea,
            OperatingHours = request.OperatingHours,
            Is24HoursAccess = request.Is24HoursAccess,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            MainDoorDirection = request.MainDoorDirection,
            Status = "DRAFT",
            PricePerM2 = request.PricePerM2,
            BoundaryPoints = string.IsNullOrEmpty(request.BoundaryPoints) ? null : request.BoundaryPoints,
        };

        var warehouseId = await _repository.CreateAsync(warehouse, cancellationToken);

        // Tạo membership OWNER cho chủ kho
        // Unique index: IX_warehouse_memberships_user_warehouse_role (user_id, warehouse_id, warehouse_role_id)
        // → cùng user có thể có nhiều membership trong 1 kho miễn khác role (OWNER + OPERATOR là hợp lệ)
        await _membershipRepository.CreateMembershipAsync(new CreateMembershipDto
        {
            UserId      = request.OwnerId,
            WarehouseId = warehouseId,
            RoleCode    = "OWNER",
            IsAllSkill  = true,
            SkillIds    = new List<int>(),
        }, cancellationToken);

        // Tạo membership OPERATOR cho chủ kho — giúp họ truy cập màn quản lý nhân sự/ca làm
        // Bọc trong try-catch vì DB có thể có unique index (user_id, warehouse_id) cũ
        // không cho phép cùng user có 2 role khác nhau trong 1 kho
        try
        {
            await _membershipRepository.CreateMembershipAsync(new CreateMembershipDto
            {
                UserId      = request.OwnerId,
                WarehouseId = warehouseId,
                RoleCode    = "OPERATOR",
                IsAllSkill  = true,
                SkillIds    = new List<int>(),
            }, cancellationToken);
        }
        catch (Exception ex) when (ex.InnerException?.Message?.Contains("duplicate key") == true
                                || ex.InnerException?.Message?.Contains("IX_warehouse_memberships") == true
                                || ex.Message.Contains("đã có membership"))
        {
            // Bỏ qua — OWNER membership đủ để vận hành
        }

        return warehouseId;
    }
}