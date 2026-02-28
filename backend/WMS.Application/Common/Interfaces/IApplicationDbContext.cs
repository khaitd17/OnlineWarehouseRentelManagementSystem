using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;

namespace WMS.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Warehouse> Warehouses { get; }
    DbSet<RentalArea> RentalAreas { get; }
    DbSet<Contract> Contracts { get; }
    DbSet<Payment> Payments { get; }
    DbSet<WmsTask> Tasks { get; }
    DbSet<Rating> Ratings { get; }
    DbSet<AuditSession> AuditSessions { get; }
    DbSet<InventoryRequest> InventoryRequests { get; }
    DbSet<InventoryItem> InventoryItems { get; }
    DbSet<WarehouseMedium> WarehouseMedia { get; }
    
    // Views
    DbSet<VActiveWarehouse> VActiveWarehouses { get; }
    DbSet<VContractPayment> VContractPayments { get; }
    DbSet<VWarehouseOccupancy> VWarehouseOccupancies { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
