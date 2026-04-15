using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.CreateWarehouse;

public class CreateWarehouseHandler : IRequestHandler<CreateWarehouseCommand, int>
{
    private readonly IWarehouseRepository _repository;
    private readonly IStaffMembershipRepository _membershipRepository;

    public CreateWarehouseHandler(
        IWarehouseRepository repository,
        IStaffMembershipRepository membershipRepository)
    {
        _repository = repository;
        _membershipRepository = membershipRepository;
    }

    public async Task<int> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = new Warehouse
        {
            OwnerId = request.OwnerId,
            Name = request.Name,
            Address = request.Address,
            Lat = request.Lat,
            Lng = request.Lng,
            Description = request.Description,
            TotalArea = request.TotalArea,
            Width = request.Width,
            Length = request.Length,
            AvailableArea = request.TotalArea,
            OperatingHours = request.OperatingHours,
            Is24HoursAccess = request.Is24HoursAccess,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            MainDoorDirection = request.MainDoorDirection,
            Status = request.Status ?? "HIDDEN",
            PricePerM2 = request.PricePerM2
        };

        var warehouseId = await _repository.CreateAsync(warehouse, cancellationToken);

        // Khi tạo kho, tự động tạo 2 memberships cho chủ kho:
        //   OWNER    → quyền thương mại (hợp đồng, thanh toán, yêu cầu thuê)
        //   OPERATOR → quyền vận hành (nhân sự, ca, nhiệm vụ, nhập/xuất kho)
        //
        // Lý do tách biệt 2 role trong DB ngay từ đầu:
        //   → Sau này muốn bàn giao người vận hành (chuyển OPERATOR sang người khác)
        //     chỉ cần thay đổi membership OPERATOR trong DB, không cần sửa code.
        //   → OWNER luôn gắn với chủ sở hữu, không bị ảnh hưởng khi bàn giao.
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