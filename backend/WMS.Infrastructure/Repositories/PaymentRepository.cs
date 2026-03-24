using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _context;

    public PaymentRepository(ApplicationDbContext context) => _context = context;

    public async Task<(List<Payment> Items, int TotalCount)> GetByUserAsync(
        int userId,
        string? status,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.Payments
            .Include(p => p.Contract)
                .ThenInclude(c => c.Warehouse)
            .Include(p => p.Contract)
                .ThenInclude(c => c.Renter)
            .Where(p => p.Contract.RenterId          == userId
                     || p.Contract.Warehouse.OwnerId == userId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);
        if (from.HasValue)
            query = query.Where(p => p.PaymentDate >= from.Value);
        if (to.HasValue)
            query = query.Where(p => p.PaymentDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.PaymentDate)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
