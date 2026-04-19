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

        // Tạo membership OWNER cho chủ kho
        // DB có unique index IX_warehouse_memberships_user_id_warehouse_id (user_id, warehouse_id)
        // → chỉ được 1 membership/user/kho. OWNER role bao gồm toàn quyền thương mại + vận hành.
        await _membershipRepository.CreateMembershipAsync(new CreateMembershipDto
        {
            UserId      = request.OwnerId,
            WarehouseId = warehouseId,
            RoleCode    = "OWNER",
            IsAllSkill  = true,
            SkillIds    = new List<int>(),
        }, cancellationToken);

        return warehouseId;
    }
}