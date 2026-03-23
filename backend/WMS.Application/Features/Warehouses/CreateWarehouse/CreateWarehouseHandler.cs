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
            Status = "HIDDEN"
        };

        var warehouseId = await _repository.CreateAsync(warehouse, cancellationToken);

        // Tự động gán OPERATOR membership cho chủ kho vừa tạo.
        // Khi chủ kho tạo kho, họ mặc định trở thành OPERATOR để vận hành kho.
        await _membershipRepository.CreateMembershipAsync(new CreateMembershipDto
        {
            UserId      = request.OwnerId,
            WarehouseId = warehouseId,
            RoleCode    = "OPERATOR",
            IsAllSkill  = true,
            IsAllZone   = true,
            SkillIds    = new List<int>(),
            ZoneIds     = new List<int>(),
        }, cancellationToken);

        return warehouseId;
    }
}