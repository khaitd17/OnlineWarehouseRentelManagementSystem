using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;
using SystemTask = System.Threading.Tasks.Task;

using DomainRentalContract = WMS.Domain.Entities.RentalContract;
using DbContract = WMS.Domain.Entities.Contract;

namespace WMS.Infrastructure.Repositories;

public class RentalContractRepository : IRentalContractRepository
{
    private readonly ApplicationDbContext _context;

    public RentalContractRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DomainRentalContract?> GetByIdAsync(int contractId)
    {
        var dbContract = await _context.Contracts
            .FirstOrDefaultAsync(c => c.ContractId == contractId);

        return dbContract != null ? MapToDomain(dbContract) : null;
    }

    public async Task<DomainRentalContract?> GetByIdWithDetailsAsync(int contractId)
    {
        var dbContract = await _context.Contracts
            .Include(c => c.Renter)
            .Include(c => c.Warehouse)
            .FirstOrDefaultAsync(c => c.ContractId == contractId);

        return dbContract != null ? MapToDomain(dbContract) : null;
    }

    public async Task<DomainRentalContract?> GetByRentalRequestIdAsync(int requestId)
    {
        var dbContract = await _context.Contracts
            .FirstOrDefaultAsync(c => c.RequestId == requestId);

        return dbContract != null ? MapToDomain(dbContract) : null;
    }

    public async Task<IEnumerable<DomainRentalContract>> GetByRenterIdAsync(int renterId)
    {
        var dbContracts = await _context.Contracts
            .Where(c => c.RenterId == renterId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return dbContracts.Select(MapToDomain).ToList();
    }

    public async Task<IEnumerable<DomainRentalContract>> GetByWarehouseIdAsync(int warehouseId)
    {
        var dbContracts = await _context.Contracts
            .Where(c => c.WarehouseId == warehouseId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return dbContracts.Select(MapToDomain).ToList();
    }

    public async Task<IEnumerable<DomainRentalContract>> GetActiveContractsAsync()
    {
        var dbContracts = await _context.Contracts
            .Where(c => c.Status == "ACTIVE")
            .ToListAsync();

        return dbContracts.Select(MapToDomain).ToList();
    }

    public async Task<int> AddAsync(DomainRentalContract contract)
    {
        var dbContract = new DbContract
        {
            RequestId = contract.RentalRequestId,
            RenterId = contract.RenterId,
            WarehouseId = contract.WarehouseId,
            ContractNumber = contract.ContractNumber,
            StartDate = DateOnly.FromDateTime(contract.StartDate),
            EndDate = DateOnly.FromDateTime(contract.EndDate),
            MonthlyPayment = contract.MonthlyPayment,
            TotalValue = contract.TotalValue,
            DepositAmount = contract.DepositAmount,
            Status = contract.Status,
            Terms = contract.Terms,
            ContractUrl = contract.ContractFileUrl,
            CreatedAt = contract.CreatedAt
        };

        _context.Contracts.Add(dbContract);
        await _context.SaveChangesAsync();

        return dbContract.ContractId;
    }


    public async SystemTask UpdateAsync(DomainRentalContract contract)
    {
        var dbContract = await _context.Contracts.FindAsync(contract.ContractId);
        if (dbContract == null)
            throw new InvalidOperationException($"Contract {contract.ContractId} not found");

        dbContract.Status = contract.Status;
        dbContract.UpdatedAt = DateTime.UtcNow;
        dbContract.ContractUrl = contract.ContractFileUrl;
        dbContract.SignedFileUrl = contract.SignedFileUrl;
        dbContract.SignedAt = contract.SignedAt;
        dbContract.Terms = contract.Terms;
        dbContract.OwnerSignedFileUrl = contract.OwnerSignedFileUrl;
        dbContract.OwnerSignedAt = contract.OwnerSignedAt;
        dbContract.OwnerSignatureBase64 = contract.OwnerSignatureBase64;
        
        // Termination/Close approval fields
        dbContract.TerminationRequestedBy = contract.TerminationRequestedBy;
        dbContract.TerminationRequestedAt = contract.TerminationRequestedAt;
        dbContract.RenterApprovedTermination = contract.RenterApprovedTermination;
        dbContract.OwnerApprovedTermination = contract.OwnerApprovedTermination;
        dbContract.TerminationReason = contract.TerminationReason;
        dbContract.EarlyTerminationFee = contract.EarlyTerminationFee;
        dbContract.TerminatedAt = contract.TerminatedAt;

        await _context.SaveChangesAsync();
    }

    public async Task<DomainRentalContract?> GetWithEquipmentsByIdAsync(int contractId)
    {
        var dbContract = await _context.Contracts
            // TODO: Fix IncludedEquipments - temporarily comment out due to type resolution issues
            // .Include(c => c.IncludedEquipments)
            .FirstOrDefaultAsync(c => c.ContractId == contractId);

        if (dbContract == null) return null;

        var domain = MapToDomain(dbContract);

        // Manual mapping for the many-to-many property since MapToDomain uses reflection for primitives
        // TODO: Re-enable when IncludedEquipments relationship is fixed
        /*
        foreach(var e in dbContract.IncludedEquipments)
        {
            domain.IncludedEquipments.Add(e);
        }
        */

        return domain;
    }

    public async Task AssignEquipmentsAsync(int contractId, List<int> equipmentIds, CancellationToken cancellationToken)
    {
        var dbContract = await _context.Contracts
            // TODO: Fix IncludedEquipments - temporarily comment out due to type resolution issues
            // .Include(c => c.IncludedEquipments)
            .FirstOrDefaultAsync(c => c.ContractId == contractId, cancellationToken)
            ?? throw new KeyNotFoundException("Contract not found");

        var equipments = await _context.Equipments
            .Where(e => equipmentIds.Contains(e.EquipmentId))
            .ToListAsync(cancellationToken);

        // TODO: Re-enable when IncludedEquipments relationship is fixed
        /*
        dbContract.IncludedEquipments.Clear();
        foreach (var equipment in equipments)
        {
            dbContract.IncludedEquipments.Add(equipment);
        }
        */

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<DomainRentalContract>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? userId = null,
        string? status = null,
        DateTime? startDateFrom = null,
        DateTime? startDateTo = null)
    {
        var query = _context.Contracts.AsQueryable();

        // Apply filters
        if (userId.HasValue)
        {
            query = query.Where(c => c.RenterId == userId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        if (startDateFrom.HasValue)
        {
            var startDateOnly = DateOnly.FromDateTime(startDateFrom.Value);
            query = query.Where(c => c.StartDate >= startDateOnly);
        }

        if (startDateTo.HasValue)
        {
            var endDateOnly = DateOnly.FromDateTime(startDateTo.Value);
            query = query.Where(c => c.StartDate <= endDateOnly);
        }

        // Apply pagination
        var dbContracts = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return dbContracts.Select(MapToDomain).ToList();
    }

    public async Task<int> CountAsync(
        int? userId = null,
        string? status = null,
        DateTime? startDateFrom = null,
        DateTime? startDateTo = null)
    {
        var query = _context.Contracts.AsQueryable();

        // Apply filters
        if (userId.HasValue)
        {
            query = query.Where(c => c.RenterId == userId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        if (startDateFrom.HasValue)
        {
            var startDateOnly = DateOnly.FromDateTime(startDateFrom.Value);
            query = query.Where(c => c.StartDate >= startDateOnly);
        }

        if (startDateTo.HasValue)
        {
            var endDateOnly = DateOnly.FromDateTime(startDateTo.Value);
            query = query.Where(c => c.StartDate <= endDateOnly);
        }

        return await query.CountAsync();
    }

    // Direct DB update for termination fields (bypass domain model reflection issues)
    public async SystemTask RequestTerminationAsync(int contractId, string requestedBy, string? reason = null, decimal? fee = null)
    {
        var dbContract = await _context.Contracts.FindAsync(contractId);
        if (dbContract == null)
            throw new InvalidOperationException($"Contract {contractId} not found");

        dbContract.Status = "PENDING_TERMINATION";
        dbContract.TerminationRequestedBy = requestedBy;
        dbContract.TerminationRequestedAt = DateTime.UtcNow;
        dbContract.TerminationReason = reason;
        dbContract.EarlyTerminationFee = fee;

        // Workflow:
        // - Renter requests early termination -> owner reviews and sets fee, renter confirms later.
        // - Owner requests termination -> owner intent is considered pre-approved.
        if (requestedBy == "OWNER")
        {
            dbContract.OwnerApprovedTermination = true;
            dbContract.RenterApprovedTermination = false;
        }
        else
        {
            dbContract.RenterApprovedTermination = false;
            dbContract.OwnerApprovedTermination = false;
        }
        
        dbContract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async SystemTask RequestCloseAsync(int contractId, string requestedBy)
    {
        var dbContract = await _context.Contracts.FindAsync(contractId);
        if (dbContract == null)
            throw new InvalidOperationException($"Contract {contractId} not found");

        dbContract.Status = "PENDING_CLOSE";
        dbContract.TerminationRequestedBy = requestedBy;
        dbContract.TerminationRequestedAt = DateTime.UtcNow;
        
        if (requestedBy == "RENTER")
            dbContract.RenterApprovedTermination = true;
        else
            dbContract.OwnerApprovedTermination = true;
        
        dbContract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async SystemTask ApproveTerminationAsync(int contractId, string approvedBy, decimal? earlyTerminationFee = null)
    {
        var dbContract = await _context.Contracts.FindAsync(contractId);
        if (dbContract == null)
            throw new InvalidOperationException($"Contract {contractId} not found");

        if (dbContract.Status != RentalContractStatus.PendingTermination &&
            dbContract.Status != RentalContractStatus.PendingClose)
        {
            throw new InvalidOperationException($"Contract is not pending termination/close. Status: {dbContract.Status}");
        }

        if (approvedBy == "RENTER")
            dbContract.RenterApprovedTermination = true;
        else
            dbContract.OwnerApprovedTermination = true;

        // Owner sets/updates fee while reviewing renter's termination request.
        if (approvedBy == "OWNER" && earlyTerminationFee.HasValue)
            dbContract.EarlyTerminationFee = earlyTerminationFee.Value;

        // If both parties approved, change status
        if (dbContract.RenterApprovedTermination && dbContract.OwnerApprovedTermination)
        {
            if (dbContract.Status == "PENDING_TERMINATION")
            {
                // If an early termination fee exists, wait for payment completion before terminating.
                if ((dbContract.EarlyTerminationFee ?? 0) <= 0)
                {
                    dbContract.Status = "TERMINATED";
                    dbContract.TerminatedAt = DateTime.UtcNow;
                }
            }
            else if (dbContract.Status == "PENDING_CLOSE")
            {
                dbContract.Status = "CLOSED";
            }
        }
        
        dbContract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async SystemTask RejectTerminationAsync(int contractId)
    {
        var dbContract = await _context.Contracts.FindAsync(contractId);
        if (dbContract == null)
            throw new InvalidOperationException($"Contract {contractId} not found");

        dbContract.Status = "ACTIVE";
        dbContract.TerminationRequestedBy = null;
        dbContract.TerminationRequestedAt = null;
        dbContract.RenterApprovedTermination = false;
        dbContract.OwnerApprovedTermination = false;
        dbContract.TerminationReason = null;
        dbContract.EarlyTerminationFee = null;
        dbContract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async SystemTask FinalizeTerminationAfterPaymentAsync(int contractId)
    {
        var dbContract = await _context.Contracts.FindAsync(contractId);
        if (dbContract == null)
            throw new InvalidOperationException($"Contract {contractId} not found");

        if (dbContract.Status != RentalContractStatus.PendingTermination)
            return;

        if (!dbContract.RenterApprovedTermination || !dbContract.OwnerApprovedTermination)
            return;

        if ((dbContract.EarlyTerminationFee ?? 0) <= 0)
            return;

        dbContract.Status = RentalContractStatus.Terminated;
        dbContract.TerminatedAt = DateTime.UtcNow;
        dbContract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    private DomainRentalContract MapToDomain(DbContract dbContract)
    {
        // Using reflection to bypass private constructor
#pragma warning disable SYSLIB0050
        var domainContract = (DomainRentalContract)System.Runtime.Serialization.FormatterServices
            .GetUninitializedObject(typeof(DomainRentalContract));
#pragma warning restore SYSLIB0050

        var contractIdProp = typeof(DomainRentalContract).GetProperty("ContractId");
        var rentalRequestIdProp = typeof(DomainRentalContract).GetProperty("RentalRequestId");
        var renterIdProp = typeof(DomainRentalContract).GetProperty("RenterId");
        var warehouseIdProp = typeof(DomainRentalContract).GetProperty("WarehouseId");
        var contractNumberProp = typeof(DomainRentalContract).GetProperty("ContractNumber");
        var startDateProp = typeof(DomainRentalContract).GetProperty("StartDate");
        var endDateProp = typeof(DomainRentalContract).GetProperty("EndDate");
        var monthlyPaymentProp = typeof(DomainRentalContract).GetProperty("MonthlyPayment");
        var totalValueProp = typeof(DomainRentalContract).GetProperty("TotalValue");
        var depositAmountProp = typeof(DomainRentalContract).GetProperty("DepositAmount");
        var statusProp = typeof(DomainRentalContract).GetProperty("Status");
        var termsProp = typeof(DomainRentalContract).GetProperty("Terms");
        var contractFileUrlProp = typeof(DomainRentalContract).GetProperty("ContractFileUrl");
        var signedFileUrlProp = typeof(DomainRentalContract).GetProperty("SignedFileUrl");
        var signedAtProp = typeof(DomainRentalContract).GetProperty("SignedAt");
        var ownerSignedFileUrlProp = typeof(DomainRentalContract).GetProperty("OwnerSignedFileUrl");
        var ownerSignedAtProp = typeof(DomainRentalContract).GetProperty("OwnerSignedAt");
        var ownerSignatureBase64Prop = typeof(DomainRentalContract).GetProperty("OwnerSignatureBase64");
        var createdAtProp = typeof(DomainRentalContract).GetProperty("CreatedAt");
        var updatedAtProp = typeof(DomainRentalContract).GetProperty("UpdatedAt");
        
        // Termination/Close approval properties
        var terminationRequestedByProp = typeof(DomainRentalContract).GetProperty("TerminationRequestedBy");
        var terminationRequestedAtProp = typeof(DomainRentalContract).GetProperty("TerminationRequestedAt");
        var renterApprovedTerminationProp = typeof(DomainRentalContract).GetProperty("RenterApprovedTermination");
        var ownerApprovedTerminationProp = typeof(DomainRentalContract).GetProperty("OwnerApprovedTermination");
        var terminationReasonProp = typeof(DomainRentalContract).GetProperty("TerminationReason");
        var earlyTerminationFeeProp = typeof(DomainRentalContract).GetProperty("EarlyTerminationFee");
        var terminatedAtProp = typeof(DomainRentalContract).GetProperty("TerminatedAt");

        contractIdProp?.SetValue(domainContract, dbContract.ContractId);
        rentalRequestIdProp?.SetValue(domainContract, dbContract.RequestId);
        renterIdProp?.SetValue(domainContract, dbContract.RenterId);
        warehouseIdProp?.SetValue(domainContract, dbContract.WarehouseId);
        contractNumberProp?.SetValue(domainContract, dbContract.ContractNumber);
        startDateProp?.SetValue(domainContract, dbContract.StartDate.ToDateTime(TimeOnly.MinValue));
        endDateProp?.SetValue(domainContract, dbContract.EndDate.ToDateTime(TimeOnly.MinValue));
        monthlyPaymentProp?.SetValue(domainContract, dbContract.MonthlyPayment);
        totalValueProp?.SetValue(domainContract, dbContract.TotalValue);
        depositAmountProp?.SetValue(domainContract, dbContract.DepositAmount);
        statusProp?.SetValue(domainContract, dbContract.Status);
        termsProp?.SetValue(domainContract, dbContract.Terms);
        contractFileUrlProp?.SetValue(domainContract, dbContract.ContractUrl);
        signedFileUrlProp?.SetValue(domainContract, dbContract.SignedFileUrl);
        signedAtProp?.SetValue(domainContract, dbContract.SignedAt);
        ownerSignedFileUrlProp?.SetValue(domainContract, dbContract.OwnerSignedFileUrl);
        ownerSignedAtProp?.SetValue(domainContract, dbContract.OwnerSignedAt);
        ownerSignatureBase64Prop?.SetValue(domainContract, dbContract.OwnerSignatureBase64);
        createdAtProp?.SetValue(domainContract, dbContract.CreatedAt ?? DateTime.UtcNow);
        updatedAtProp?.SetValue(domainContract, dbContract.UpdatedAt);
        
        // Map termination/close approval fields
        terminationRequestedByProp?.SetValue(domainContract, dbContract.TerminationRequestedBy);
        terminationRequestedAtProp?.SetValue(domainContract, dbContract.TerminationRequestedAt);
        renterApprovedTerminationProp?.SetValue(domainContract, dbContract.RenterApprovedTermination);
        ownerApprovedTerminationProp?.SetValue(domainContract, dbContract.OwnerApprovedTermination);
        terminationReasonProp?.SetValue(domainContract, dbContract.TerminationReason);
        earlyTerminationFeeProp?.SetValue(domainContract, dbContract.EarlyTerminationFee);
        terminatedAtProp?.SetValue(domainContract, dbContract.TerminatedAt);

        return domainContract;
    }
}
