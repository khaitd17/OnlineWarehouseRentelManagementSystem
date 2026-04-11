using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class SubscriptionPackageRepository : ISubscriptionPackageRepository
{
    private readonly ApplicationDbContext _db;

    public SubscriptionPackageRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<SubscriptionPackage?> GetByNameAsync(string name)
    {
        return await _db.SubscriptionPackages.FirstOrDefaultAsync(p => p.Name == name);
    }

    public async Task<IEnumerable<SubscriptionPackage>> GetAllAsync()
    {
        return await _db.SubscriptionPackages.ToListAsync();
    }

    public async Task<SubscriptionPackage?> GetByIdAsync(int id)
    {
        return await _db.SubscriptionPackages.FindAsync(id);
    }

    public async Task AddAsync(SubscriptionPackage package)
    {
        await _db.SubscriptionPackages.AddAsync(package);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(SubscriptionPackage package)
    {
        _db.SubscriptionPackages.Update(package);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(SubscriptionPackage package)
    {
        _db.SubscriptionPackages.Remove(package);
        await _db.SaveChangesAsync();
    }
}
