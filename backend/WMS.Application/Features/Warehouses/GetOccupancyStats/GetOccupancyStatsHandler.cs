using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetOccupancyStats;

public class GetOccupancyStatsHandler : IRequestHandler<GetOccupancyStatsQuery, OccupancyStatsDto>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IRentalRequestRepository _rentalRequestRepository;
    private readonly IEquipmentRepository _equipmentRepository;

    public GetOccupancyStatsHandler(
        IWarehouseRepository warehouseRepository,
        IRentalRequestRepository rentalRequestRepository,
        IEquipmentRepository equipmentRepository)
    {
        _warehouseRepository = warehouseRepository;
        _rentalRequestRepository = rentalRequestRepository;
        _equipmentRepository = equipmentRepository;
    }

    public async Task<OccupancyStatsDto> Handle(GetOccupancyStatsQuery request, CancellationToken cancellationToken)
    {
        var warehouses = await _warehouseRepository.GetByOwnerIdAsync(request.OwnerId, cancellationToken);
        var allRequests = (await _rentalRequestRepository.GetByOwnerIdAsync(request.OwnerId)).ToList();
        var allEquipment = await _equipmentRepository.GetByOwnerIdAsync(request.OwnerId, cancellationToken);
        
        var today = DateTime.UtcNow.Date;
        
        var warehouseDtos = new List<WarehouseOccupancyDto>();
        foreach (var w in warehouses)
        {
            var wRequests = allRequests.Where(r => r.WarehouseId == w.WarehouseId && r.Status == "APPROVED").ToList();
            
            // Occupied: approved and date overlaps today
            var occupied = wRequests
                .Where(r => r.StartDate.Date <= today && r.StartDate.AddMonths(r.DurationMonths).Date >= today)
                .Sum(r => r.RequestedArea);
                
            // Reserved: approved and starts in future
            var reserved = wRequests
                .Where(r => r.StartDate.Date > today)
                .Sum(r => r.RequestedArea);
                
            var available = w.TotalArea - occupied - reserved;
            if (available < 0) available = 0;

            warehouseDtos.Add(new WarehouseOccupancyDto
            {
                WarehouseId = w.WarehouseId,
                Name = w.Name,
                TotalArea = w.TotalArea,
                OccupiedArea = occupied,
                ReservedArea = reserved,
                AvailableArea = available,
                OccupancyRate = w.TotalArea > 0 ? (occupied / w.TotalArea) * 100 : 0
            });
        }

        var totalGlobalArea = warehouses.Sum(w => w.TotalArea);
        var totalOccupiedArea = warehouseDtos.Sum(d => d.OccupiedArea);
        var totalReservedArea = warehouseDtos.Sum(d => d.ReservedArea);
        var totalAvailableArea = totalGlobalArea - totalOccupiedArea - totalReservedArea;
        
        // Trends for last 30 days
        var trends = new List<OccupancyTrendDto>();
        for (int i = 29; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var occupiedOnDate = allRequests
                .Where(r => r.Status == "APPROVED" && r.StartDate.Date <= date && r.StartDate.AddMonths(r.DurationMonths).Date >= date)
                .Sum(r => r.RequestedArea);
            
            trends.Add(new OccupancyTrendDto {
                Date = date.ToString("yyyy-MM-dd"),
                Rate = totalGlobalArea > 0 ? (occupiedOnDate / totalGlobalArea) * 100 : 0
            });
        }

        // Equipment Stats
        var totalEquipment = allEquipment.Count;
        var rentedEquipment = allEquipment.Count(e => e.Status == "RENTED" || e.Status == "IN_USE");
        
        return new OccupancyStatsDto
        {
            TotalWarehouses = warehouses.Count,
            TotalGlobalArea = totalGlobalArea,
            TotalOccupiedArea = totalOccupiedArea,
            TotalReservedArea = totalReservedArea,
            TotalAvailableArea = totalAvailableArea > 0 ? totalAvailableArea : 0,
            AverageOccupancyRate = warehouseDtos.Any() ? warehouseDtos.Average(d => d.OccupancyRate) : 0,
            Warehouses = warehouseDtos,
            OccupancyTrends = trends,
            EquipmentStats = new EquipmentSummaryDto
            {
                TotalEquipment = totalEquipment,
                RentedEquipment = rentedEquipment,
                AvailableEquipment = totalEquipment - rentedEquipment,
                UtilizationPercentage = totalEquipment > 0 ? ((double)rentedEquipment / totalEquipment) * 100 : 0
            }
        };
    }
}
