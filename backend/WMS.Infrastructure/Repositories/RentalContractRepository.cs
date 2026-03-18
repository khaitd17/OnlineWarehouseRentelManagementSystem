using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
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
        var createdAtProp = typeof(DomainRentalContract).GetProperty("CreatedAt");
        var updatedAtProp = typeof(DomainRentalContract).GetProperty("UpdatedAt");

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
        createdAtProp?.SetValue(domainContract, dbContract.CreatedAt ?? DateTime.UtcNow);
        updatedAtProp?.SetValue(domainContract, dbContract.UpdatedAt);

        return domainContract;
    }
}
