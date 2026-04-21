using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RentalAreaRepository : IRentalAreaRepository
{
    private readonly ApplicationDbContext _context;

    public RentalAreaRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateAsync(RentalArea rentalArea, CancellationToken cancellationToken)
    {
        await _context.RentalAreas.AddAsync(rentalArea, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return rentalArea.Id;
    }

    public async Task<RentalArea?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.RentalAreas
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<List<RentalArea>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken)
    {
        return await _context.RentalAreas
            .Where(r => r.WarehouseId == warehouseId)
            .ToListAsync(cancellationToken);
    }

    private static readonly HashSet<string> OccupiedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "ACTIVE", "PENDING_PAYMENT", "SIGNED",
        "PENDING_OWNER_SIGNATURE", "PENDING_RENTER_SIGNATURE",
        "PENDING_SIGNATURE", "DRAFT",
        "PENDING_TERMINATION", "PENDING_CLOSE"
    };

    public async Task<List<RentalArea>> GetWithOccupancyByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken)
    {
        var areas = await _context.RentalAreas
            .Where(a => a.WarehouseId == warehouseId)
            .ToListAsync(cancellationToken);

        // Join rental_requests + contracts to find occupied areas and custom mapped areas
        var occupied = await _context.Contracts
            .Where(c => OccupiedStatuses.Contains(c.Status) && c.WarehouseId == warehouseId)
            .Join(_context.RentalRequests,
                c => c.RequestId,
                r => r.RequestId,
                (c, r) => new { 
                    c.ContractId, 
                    r.RentalAreaId,
                    r.BaseRentalAreaId,
                    r.IsCustomArea,
                    r.ProposedPositionX,
                    r.ProposedPositionY,
                    r.ProposedWidth,
                    r.ProposedLength
                })
            .ToListAsync(cancellationToken);

        var resultAreas = new List<RentalArea>();
        var baseAreasToRemove = new HashSet<int>();

        // 1. Regular occupied full-areas
        var fullOccupiedMap = occupied
            .Where(x => x.RentalAreaId != null && !x.IsCustomArea)
            .GroupBy(x => x.RentalAreaId!.Value)
            .ToDictionary(g => g.Key, g => g.First().ContractId);

        // 2. Custom mapped areas (splits)
        var customSplits = occupied
            .Where(x => x.IsCustomArea && x.BaseRentalAreaId != null)
            .ToList();

        foreach (var area in areas)
        {
            if (fullOccupiedMap.TryGetValue(area.Id, out var cid))
            {
                area.IsOccupied = true;
                area.ActiveContractId = cid;
                resultAreas.Add(area);
                continue;
            }

            var customSplit = customSplits.FirstOrDefault(x => x.BaseRentalAreaId == area.Id);
            if (customSplit != null)
            {
                baseAreasToRemove.Add(area.Id);
                
                double height = ((area.Width ?? 0) > 0 && (area.Length ?? 0) > 0) 
                    ? (area.Size) / ((area.Width ?? 1) * (area.Length ?? 1)) 
                    : 5.0;

                // Add Khu A (Occupied)
                // Use a negative deterministic ID so React maps uniquely (e.g., -100 * area.Id)
                var areaA = new RentalArea
                {
                    Id = -(area.Id * 100),
                    WarehouseId = area.WarehouseId,
                    Name = area.Name + "A",
                    PositionX = customSplit.ProposedPositionX ?? area.PositionX,
                    PositionY = customSplit.ProposedPositionY ?? area.PositionY,
                    Width = customSplit.ProposedWidth ?? area.Width,
                    Length = customSplit.ProposedLength ?? area.Length,
                    Size = (customSplit.ProposedWidth ?? 0) * (customSplit.ProposedLength ?? 0) * height,
                    IsOccupied = true,
                    ActiveContractId = customSplit.ContractId,
                    Description = area.Description
                };
                resultAreas.Add(areaA);

                // Add Khu B (Remaining Available)
                bool isFullWidth = (customSplit.ProposedWidth ?? 0) == (area.Width ?? 0);
                bool isFullLength = (customSplit.ProposedLength ?? 0) == (area.Length ?? 0);
                bool isTopAligned = (customSplit.ProposedPositionY ?? 0) == (area.PositionY ?? 0);
                bool isLeftAligned = (customSplit.ProposedPositionX ?? 0) == (area.PositionX ?? 0);

                var areaB = new RentalArea
                {
                    Id = -(area.Id * 100 + 1),
                    WarehouseId = area.WarehouseId,
                    Name = area.Name + "B",
                    IsOccupied = false,
                    ActiveContractId = null,
                    Description = area.Description
                };

                if (isFullWidth && !isFullLength)
                {
                    areaB.Width = area.Width;
                    areaB.Length = area.Length - customSplit.ProposedLength;
                    areaB.PositionX = area.PositionX;
                    areaB.PositionY = isTopAligned 
                        ? area.PositionY + customSplit.ProposedLength 
                        : area.PositionY;
                    areaB.Size = (areaB.Width ?? 0) * (areaB.Length ?? 0) * height;
                }
                else if (isFullLength && !isFullWidth)
                {
                    areaB.Width = area.Width - customSplit.ProposedWidth;
                    areaB.Length = area.Length;
                    areaB.PositionY = area.PositionY;
                    areaB.PositionX = isLeftAligned 
                        ? area.PositionX + customSplit.ProposedWidth 
                        : area.PositionX;
                    areaB.Size = (areaB.Width ?? 0) * (areaB.Length ?? 0) * height;
                }

                if ((areaB.Size) > 0)
                {
                    resultAreas.Add(areaB);
                }
                continue;
            }

            // Normal unoccupied area
            resultAreas.Add(area);
        }

        return resultAreas;
    }

    public async Task UpdateAsync(RentalArea rentalArea, CancellationToken cancellationToken)
    {
        _context.RentalAreas.Update(rentalArea);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(RentalArea rentalArea, CancellationToken cancellationToken)
    {
        // Null-out all FK references to avoid constraint violations
        // 1. rental_requests.RentalAreaId
        var linkedRequests = await _context.RentalRequests
            .Where(r => r.RentalAreaId == rentalArea.Id)
            .ToListAsync(cancellationToken);
        foreach (var req in linkedRequests)
            req.RentalAreaId = null;

        // 2. equipments.RentalAreaId
        var linkedEquipment = await _context.Equipments
            .Where(e => e.RentalAreaId == rentalArea.Id)
            .ToListAsync(cancellationToken);
        foreach (var eq in linkedEquipment)
            eq.RentalAreaId = null;

        // 3. equipment_histories.PreviousRentalAreaId / NewRentalAreaId
        var linkedHistory = await _context.EquipmentHistories
            .Where(h => h.PreviousRentalAreaId == rentalArea.Id || h.NewRentalAreaId == rentalArea.Id)
            .ToListAsync(cancellationToken);
        foreach (var h in linkedHistory)
        {
            if (h.PreviousRentalAreaId == rentalArea.Id) h.PreviousRentalAreaId = null;
            if (h.NewRentalAreaId == rentalArea.Id) h.NewRentalAreaId = null;
        }

        _context.RentalAreas.Remove(rentalArea);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<double> GetTotalAllocatedAreaAsync(int warehouseId, CancellationToken cancellationToken)
    {
        return await _context.RentalAreas
            .Where(r => r.WarehouseId == warehouseId)
            .SumAsync(r => r.Size, cancellationToken);
    }

    public async Task<double> GetTotalAllocatedFloorAreaAsync(int warehouseId, CancellationToken cancellationToken)
    {
        var areas = await _context.RentalAreas
            .Where(r => r.WarehouseId == warehouseId && r.Width.HasValue && r.Length.HasValue)
            .Select(r => new { r.Width, r.Length })
            .ToListAsync(cancellationToken);
        return areas.Sum(r => (r.Width ?? 0) * (r.Length ?? 0));
    }

    public async Task<bool> IsAreaOccupiedAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.Contracts
            .Where(c => OccupiedStatuses.Contains(c.Status))
            .Join(_context.RentalRequests,
                c => c.RequestId,
                r => r.RequestId,
                (c, r) => r.RentalAreaId)
            .AnyAsync(areaId => areaId == id, cancellationToken);
    }
}
