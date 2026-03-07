using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;
using ScaffoldRentalRequest = WMS.Infrastructure.Persistence.ScaffoldModels.RentalRequest;
using DomainRentalRequest = WMS.Domain.Entities.RentalRequest;
using Task = System.Threading.Tasks.Task;

namespace WMS.Infrastructure.Repositories;

public class RentalRequestRepository : IRentalRequestRepository
{
    private readonly ApplicationDbContext _context;

    public RentalRequestRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    private DomainRentalRequest? MapToDomain(ScaffoldRentalRequest? scaffold)
    {
        if (scaffold == null) return null;
        
        // Use reflection to create domain entity with private constructor
        var domainEntity = (DomainRentalRequest)System.Runtime.Serialization.FormatterServices
            .GetUninitializedObject(typeof(DomainRentalRequest));
        
        var idProp = typeof(DomainRentalRequest).GetProperty("Id");
        var renterIdProp = typeof(DomainRentalRequest).GetProperty("RenterId");
        var warehouseIdProp = typeof(DomainRentalRequest).GetProperty("WarehouseId");
        var requestedAreaProp = typeof(DomainRentalRequest).GetProperty("RequestedArea");
        var durationMonthsProp = typeof(DomainRentalRequest).GetProperty("DurationMonths");
        var statusProp = typeof(DomainRentalRequest).GetProperty("Status");
        var notesProp = typeof(DomainRentalRequest).GetProperty("Notes");
        var createdAtProp = typeof(DomainRentalRequest).GetProperty("CreatedAt");
        var reviewedByProp = typeof(DomainRentalRequest).GetProperty("ReviewedBy");
        var rejectionReasonProp = typeof(DomainRentalRequest).GetProperty("RejectionReason");
        
        idProp?.SetValue(domainEntity, scaffold.RequestId);
        renterIdProp?.SetValue(domainEntity, scaffold.RenterId);
        warehouseIdProp?.SetValue(domainEntity, scaffold.WarehouseId);
        requestedAreaProp?.SetValue(domainEntity, scaffold.RequestedArea);
        durationMonthsProp?.SetValue(domainEntity, scaffold.DurationMonths);
        statusProp?.SetValue(domainEntity, scaffold.Status ?? "PENDING");
        notesProp?.SetValue(domainEntity, scaffold.Notes);
        createdAtProp?.SetValue(domainEntity, scaffold.CreatedAt ?? DateTime.UtcNow);
        reviewedByProp?.SetValue(domainEntity, scaffold.ReviewedBy);
        rejectionReasonProp?.SetValue(domainEntity, scaffold.RejectionReason);
        
        return domainEntity;
    }

    public async Task<DomainRentalRequest?> GetByIdAsync(int id)
    {
        var scaffold = await _context.RentalRequests
            .FirstOrDefaultAsync(r => r.RequestId == id);
        return MapToDomain(scaffold);
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetAllAsync()
    {
        var scaffolds = await _context.RentalRequests
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return scaffolds.Select(s => MapToDomain(s)!).Where(d => d != null);
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByRenterIdAsync(int renterId)
    {
        var scaffolds = await _context.RentalRequests
            .Where(r => r.RenterId == renterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return scaffolds.Select(s => MapToDomain(s)!).Where(d => d != null);
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByWarehouseIdAsync(int warehouseId)
    {
        var scaffolds = await _context.RentalRequests
            .Where(r => r.WarehouseId == warehouseId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return scaffolds.Select(s => MapToDomain(s)!).Where(d => d != null);
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByStatusAsync(string status)
    {
        var scaffolds = await _context.RentalRequests
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return scaffolds.Select(s => MapToDomain(s)!).Where(d => d != null);
    }

    public async Task<int> AddAsync(DomainRentalRequest rentalRequest)
    {
        var scaffold = new ScaffoldRentalRequest
        {
            RenterId = rentalRequest.RenterId,
            WarehouseId = rentalRequest.WarehouseId,
            RequestedArea = rentalRequest.RequestedArea,
            DurationMonths = rentalRequest.DurationMonths,
            Status = rentalRequest.Status,
            Notes = rentalRequest.Notes,
            CreatedAt = rentalRequest.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.RentalRequests.Add(scaffold);
        await _context.SaveChangesAsync();
        return scaffold.RequestId;
    }

    public async Task UpdateAsync(DomainRentalRequest rentalRequest)
    {
        var scaffold = await _context.RentalRequests.FindAsync(rentalRequest.Id);
        if (scaffold != null)
        {
            scaffold.Status = rentalRequest.Status;
            scaffold.Notes = rentalRequest.Notes;
            scaffold.ReviewedBy = rentalRequest.ReviewedBy;
            scaffold.RejectionReason = rentalRequest.RejectionReason;
            scaffold.ReviewedAt = rentalRequest.ApprovedAt ?? rentalRequest.RejectedAt;
            scaffold.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var scaffold = await _context.RentalRequests.FindAsync(id);
        if (scaffold == null)
            return false;

        _context.RentalRequests.Remove(scaffold);
        await _context.SaveChangesAsync();
        return true;
    }
}
