using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalAreas.CreateRentalArea;

public class CreateRentalAreaHandler : IRequestHandler<CreateRentalAreaCommand, int>
{
    private readonly IRentalAreaRepository _rentalAreaRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public CreateRentalAreaHandler(IRentalAreaRepository rentalAreaRepository, IWarehouseRepository warehouseRepository)
    {
        _rentalAreaRepository = rentalAreaRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<int> Handle(CreateRentalAreaCommand request, CancellationToken cancellationToken)
    {
        // ── Module 1: Rental Area Validation ─────────────────────────────────
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Tên khu vực không được để trống.");
        if (request.Name.Trim().Length < 2 || request.Name.Trim().Length > 100)
            throw new ArgumentException("Tên khu vực phải từ 2 đến 100 ký tự.");

        if (request.Size <= 0)
            throw new ArgumentException("Kích thước khu vực phải lớn hơn 0.");

        if (request.Width.HasValue && request.Width.Value <= 0)
            throw new ArgumentException("Chiều rộng khu vực phải lớn hơn 0.");
        if (request.Length.HasValue && request.Length.Value <= 0)
            throw new ArgumentException("Chiều dài khu vực phải lớn hơn 0.");
        if (request.PositionX.HasValue && request.PositionX.Value < 0)
            throw new ArgumentException("Vị trí X không được âm.");
        if (request.PositionY.HasValue && request.PositionY.Value < 0)
            throw new ArgumentException("Vị trí Y không được âm.");
        // ───────────────────────────────────────────────────────────────

        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            throw new Exception("Warehouse not found");
        }

        var totalAllocated = await _rentalAreaRepository.GetTotalAllocatedAreaAsync(request.WarehouseId, cancellationToken);

        // TotalArea stores the total volume capacity (m³ = W × L × H).
        // zone.Size is also in m³, so compare directly.
        if (totalAllocated + request.Size > warehouse.TotalArea + 0.01)
        {
            var remaining = Math.Round(warehouse.TotalArea - totalAllocated, 2);
            throw new Exception($"Không thể tạo khu vực. Tổng thể tích vượt quá sức chứa kho ({warehouse.TotalArea} m³). Còn trống: {remaining} m³");
        }

        // Validate overlap
        if (request.PositionX.HasValue && request.PositionY.HasValue && request.Width.HasValue && request.Length.HasValue)
        {
            var existingAreas = await _rentalAreaRepository.GetByWarehouseIdAsync(request.WarehouseId, cancellationToken);
            foreach (var existing in existingAreas)
            {
                if (existing.PositionX.HasValue && existing.PositionY.HasValue && existing.Width.HasValue && existing.Length.HasValue)
                {
                    bool overlapX = request.PositionX < (existing.PositionX + existing.Width) && 
                                    (request.PositionX + request.Width) > existing.PositionX;
                    bool overlapY = request.PositionY < (existing.PositionY + existing.Length) && 
                                    (request.PositionY + request.Length) > existing.PositionY;

                    if (overlapX && overlapY)
                    {
                        throw new Exception($"Rental area overlaps with existing area: {existing.Name}");
                    }
                }
            }
        }

        var rentalArea = new RentalArea
        {
            WarehouseId = request.WarehouseId,
            Name = request.Name,
            Size = request.Size,
            Description = request.Description,
            PositionX = request.PositionX,
            PositionY = request.PositionY,
            Width = request.Width,
            Length = request.Length
        };

        return await _rentalAreaRepository.CreateAsync(rentalArea, cancellationToken);
    }
}
