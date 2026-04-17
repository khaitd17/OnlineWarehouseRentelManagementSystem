using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RentalPaymentRepository : IRentalPaymentRepository
{
    private readonly ApplicationDbContext _db;

    public RentalPaymentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<RentalPayment?> GetByIdAsync(int paymentId)
    {
        return await _db.RentalPayments
            .Include(p => p.Contract)
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
    }

    public async Task<RentalPayment?> GetByIdWithDetailsAsync(int paymentId)
    {
        return await _db.RentalPayments
            .Include(p => p.Contract)
            .ThenInclude(c => c!.Renter)
            .Include(p => p.Contract)
            .ThenInclude(c => c!.Warehouse)
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
    }

    public async Task<RentalPayment?> GetByPaymentCodeAsync(string paymentCode)
    {
        return await _db.RentalPayments
            .Include(p => p.Contract)
            .FirstOrDefaultAsync(p => p.PaymentCode == paymentCode);
    }

    public async Task<IEnumerable<RentalPayment>> GetByContractIdAsync(int contractId)
    {
        return await _db.RentalPayments
            .Where(p => p.ContractId == contractId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<RentalPayment>> GetCompletedByContractIdAsync(int contractId)
    {
        return await _db.RentalPayments
            .Where(p => p.ContractId == contractId && p.Status == PaymentStatus.Completed)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<RentalPayment?> GetPendingPaymentByContractAsync(int contractId, string paymentType)
    {
        return await _db.RentalPayments
            .FirstOrDefaultAsync(p => p.ContractId == contractId
                                      && p.PaymentType == paymentType
                                      && p.Status == "PENDING"
                                      && (p.ExpiredAt == null || p.ExpiredAt > DateTime.UtcNow)); // Exclude expired
    }

    public async Task<int> AddAsync(RentalPayment payment)
    {
        _db.RentalPayments.Add(payment);
        await _db.SaveChangesAsync();
        return payment.PaymentId;
    }

    public async Task UpdateAsync(RentalPayment payment)
    {
        _db.RentalPayments.Update(payment);
        await _db.SaveChangesAsync();
    }

    public async Task UpdatePaymentCodeAsync(int paymentId, string paymentCode)
    {
        // Use a targeted SQL UPDATE to avoid EF tracking conflicts and ensure immediate persistence
        await _db.Database.ExecuteSqlRawAsync(
            "UPDATE rental_payments SET payment_code = {0}, updated_at = {1} WHERE payment_id = {2}",
            paymentCode,
            DateTime.UtcNow,
            paymentId);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
