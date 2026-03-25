using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IPaymentRepository
{
    Task<(List<Payment> Items, int TotalCount)> GetByUserAsync(
        int userId,
        string? status,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
