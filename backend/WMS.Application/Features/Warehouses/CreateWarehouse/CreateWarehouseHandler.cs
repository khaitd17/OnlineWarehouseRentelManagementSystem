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
            Width = request.Width,
            Length = request.Length,
            AvailableArea = request.TotalArea,
            OperatingHours = request.OperatingHours,
            Is24HoursAccess = request.Is24HoursAccess,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            MainDoorDirection = request.MainDoorDirection,
            Status = "DRAFT",
            PricePerM2 = request.PricePerM2
        };

        var warehouseId = await _repository.CreateAsync(warehouse, cancellationToken);

        // Khi tạo kho mới → tự động tạo 2 memberships cho chủ kho:
        //   OWNER    → quyền thương mại (hợp đồng, thanh toán, yêu cầu thuê)
        //   OPERATOR → quyền vận hành (nhân sự, ca làm việc, nhiệm vụ, nhập/xuất kho)
        //
        // Thiết kế này cho phép bàn giao quyền vận hành (OPERATOR) sang người khác
        // mà không ảnh hưởng đến quyền thương mại (OWNER) của chủ sở hữu.
        // DB constraint mới: UNIQUE(user_id, warehouse_id, warehouse_role_id)
        // → cùng user có thể có nhiều role khác nhau trong cùng 1 kho.
        await _membershipRepository.CreateMembershipAsync(new CreateMembershipDto
        {
            UserId      = request.OwnerId,
            WarehouseId = warehouseId,
            RoleCode    = "OWNER",
            IsAllSkill  = true,
            SkillIds    = new List<int>(),
        }, cancellationToken);

        await _membershipRepository.CreateMembershipAsync(new CreateMembershipDto
        {
            UserId      = request.OwnerId,
            WarehouseId = warehouseId,
            RoleCode    = "OPERATOR",
            IsAllSkill  = true,
            SkillIds    = new List<int>(),
        }, cancellationToken);

        return warehouseId;
    }
}