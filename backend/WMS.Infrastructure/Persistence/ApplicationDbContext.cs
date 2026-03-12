using Microsoft.EntityFrameworkCore;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // ScaffoldModels DbSets
    public DbSet<AuditResult> AuditResults => Set<AuditResult>();
    public DbSet<AuditSession> AuditSessions => Set<AuditSession>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<InventoryRequest> InventoryRequests => Set<InventoryRequest>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Task> Tasks => Set<Task>();
    public DbSet<TaskAssignment> TaskAssignments => Set<TaskAssignment>();
    public DbSet<TaskType> TaskTypes => Set<TaskType>();
    public DbSet<WarehouseDocument> WarehouseDocuments => Set<WarehouseDocument>();
    public DbSet<WarehouseMedium> WarehouseMedia => Set<WarehouseMedium>();
    public DbSet<WarehouseMembership> WarehoseMemberships => Set<WarehouseMembership>();
    public DbSet<WarehouseRole> WarehouseRoles => Set<WarehouseRole>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}