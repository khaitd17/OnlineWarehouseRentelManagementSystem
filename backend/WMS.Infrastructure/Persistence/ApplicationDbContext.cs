using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<RentalRequest> RentalRequests => Set<RentalRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.Property(x => x.PricePerMonth)
                  .HasPrecision(18, 2);
        });

        modelBuilder.Entity<RentalRequest>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Status)
                  .HasMaxLength(20)
                  .IsRequired();

            entity.Property(x => x.Notes)
                  .HasMaxLength(1000);

            entity.Property(x => x.RejectionReason)
                  .HasMaxLength(500);

            entity.HasOne(x => x.Warehouse)
                  .WithMany()
                  .HasForeignKey(x => x.WarehouseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.RenterId);
            entity.HasIndex(x => x.WarehouseId);
        });
    }
}