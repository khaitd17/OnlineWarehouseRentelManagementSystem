using System.Collections.Generic;
using System.Threading.Tasks;
using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface ISubscriptionPackageRepository
{
    Task<SubscriptionPackage?> GetByNameAsync(string name);
    Task<IEnumerable<SubscriptionPackage>> GetAllAsync();
    Task<SubscriptionPackage?> GetByIdAsync(int id);
    Task AddAsync(SubscriptionPackage package);
    Task UpdateAsync(SubscriptionPackage package);
    Task DeleteAsync(SubscriptionPackage package);
}
