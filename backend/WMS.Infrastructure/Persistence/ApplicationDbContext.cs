using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AuditResult> AuditResults { get; set; }

    public virtual DbSet<AuditSession> AuditSessions { get; set; }

    public virtual DbSet<Contract> Contracts { get; set; }

    public virtual DbSet<Equipment> Equipments { get; set; }

    public virtual DbSet<InventoryItem> InventoryItems { get; set; }

    public virtual DbSet<InventoryRequest> InventoryRequests { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Rating> Ratings { get; set; }

    public virtual DbSet<RentalRequest> RentalRequests { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<WarehouseMembership> WarehouseMemberships { get; set; }

    public virtual DbSet<WarehouseRole> WarehouseRoles { get; set; }

    public virtual DbSet<Skill> Skills { get; set; }

    public virtual DbSet<TaskType> TaskTypes { get; set; }

    public virtual DbSet<TaskAssignment> TaskAssignments { get; set; }

    public virtual DbSet<WarehouseTask> WarehouseTasks { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<VActiveWarehouse> VActiveWarehouses { get; set; }

    public virtual DbSet<VContractPayment> VContractPayments { get; set; }

    public virtual DbSet<VWarehouseOccupancy> VWarehouseOccupancies { get; set; }

    public virtual DbSet<Warehouse> Warehouses { get; set; }

    public virtual DbSet<WarehouseDocument> WarehouseDocuments { get; set; }

    public virtual DbSet<WarehouseMedium> WarehouseMedia { get; set; }

    public virtual DbSet<WarehouseInventory> WarehouseInventories { get; set; }

    public virtual DbSet<InventoryTransaction> InventoryTransactions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer("Server=localhost;Database=OWRMS;uid=sa;pwd=sa;Trusted_Connection=True;TrustServerCertificate=True;");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AuditResult>(entity =>
        {
            entity.HasKey(e => e.ResultId).HasName("PK__audit_re__AFB3C316E98B7AC0");
            entity.ToTable("audit_results");
            entity.HasIndex(e => e.AuditId, "idx_audit_results_audit");
            entity.Property(e => e.ResultId).HasColumnName("result_id");
            entity.Property(e => e.ActualQty).HasColumnName("actual_qty");
            entity.Property(e => e.AuditId).HasColumnName("audit_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.Discrepancy).HasComputedColumnSql("([actual_qty]-[expected_qty])", true).HasColumnName("discrepancy");
            entity.Property(e => e.DiscrepancyReason).HasColumnName("discrepancy_reason");
            entity.Property(e => e.ExpectedQty).HasColumnName("expected_qty");
            entity.Property(e => e.ItemName).HasMaxLength(255).HasColumnName("item_name");
            entity.HasOne(d => d.Audit).WithMany(p => p.AuditResults).HasForeignKey(d => d.AuditId).HasConstraintName("FK_audit_results_audit");
        });

        modelBuilder.Entity<AuditSession>(entity =>
        {
            entity.HasKey(e => e.AuditId).HasName("PK__audit_se__5AF33E337F6DAD00");
            entity.ToTable("audit_sessions");
            entity.HasIndex(e => e.CreatedAt, "idx_audit_sessions_created_at");
            entity.HasIndex(e => e.Status, "idx_audit_sessions_status");
            entity.HasIndex(e => e.WarehouseId, "idx_audit_sessions_warehouse");
            entity.Property(e => e.AuditId).HasColumnName("audit_id");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("OPEN").HasColumnName("status");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.AuditSessions).HasForeignKey(d => d.CreatedBy).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_audit_sessions_creator");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.AuditSessions).HasForeignKey(d => d.WarehouseId).HasConstraintName("FK_audit_sessions_warehouse");
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.ContractId).HasName("PK__contract__F8D664239D04D92E");
            entity.ToTable("contracts", tb => tb.HasTrigger("TR_contracts_updated_at"));
            entity.HasIndex(e => e.ContractNumber, "UQ__contract__1CA37CCE4DCEA66E").IsUnique();
            entity.HasIndex(e => new { e.StartDate, e.EndDate }, "idx_contracts_dates");
            entity.HasIndex(e => e.RenterId, "idx_contracts_renter");
            entity.HasIndex(e => e.RequestId, "idx_contracts_request");
            entity.HasIndex(e => e.Status, "idx_contracts_status");
            entity.HasIndex(e => e.WarehouseId, "idx_contracts_warehouse");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.ContractNumber).HasMaxLength(100).HasColumnName("contract_number");
            entity.Property(e => e.ContractUrl).HasColumnName("contract_url");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.DepositAmount).HasColumnType("decimal(15, 2)").HasColumnName("deposit_amount");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.MonthlyPayment).HasColumnType("decimal(15, 2)").HasColumnName("monthly_payment");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("ACTIVE").HasColumnName("status");
            entity.Property(e => e.TerminatedAt).HasColumnName("terminated_at");
            entity.Property(e => e.TerminationReason).HasColumnName("termination_reason");
            entity.Property(e => e.TotalValue).HasColumnType("decimal(15, 2)").HasColumnName("total_value");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.Renter).WithMany(p => p.Contracts).HasForeignKey(d => d.RenterId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_contracts_renter");
            entity.HasOne(d => d.Request).WithMany(p => p.Contracts).HasForeignKey(d => d.RequestId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_contracts_request");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.Contracts).HasForeignKey(d => d.WarehouseId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_contracts_warehouse");
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.EquipmentId).HasName("PK__equipmen__197068AFB451FEC1");
            entity.ToTable("equipments", tb => tb.HasTrigger("TR_equipments_updated_at"));
            entity.HasIndex(e => e.IotDeviceId, "idx_equipments_iot");
            entity.HasIndex(e => e.Status, "idx_equipments_status");
            entity.HasIndex(e => e.WarehouseId, "idx_equipments_warehouse");
            entity.Property(e => e.EquipmentId).HasColumnName("equipment_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.IotDeviceId).HasMaxLength(100).HasColumnName("iot_device_id");
            entity.Property(e => e.LastMaintenanceDate).HasColumnName("last_maintenance_date");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.NextMaintenanceDate).HasColumnName("next_maintenance_date");
            entity.Property(e => e.PurchaseDate).HasColumnName("purchase_date");
            entity.Property(e => e.Specifications).HasColumnName("specifications");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("ACTIVE").HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.Equipment).HasForeignKey(d => d.WarehouseId).HasConstraintName("FK_equipments_warehouse");
        });

        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.HasKey(e => e.ItemId).HasName("PK__inventor__52020FDDDDD8B22E");
            entity.ToTable("inventory_items");
            entity.HasIndex(e => e.InvReqId, "idx_inventory_items_request");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.InvReqId).HasColumnName("inv_req_id");
            entity.Property(e => e.ItemName).HasMaxLength(255).HasColumnName("item_name");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.Unit).HasMaxLength(50).HasColumnName("unit");
            entity.Property(e => e.Weight).HasColumnType("decimal(10, 2)").HasColumnName("weight");
            entity.HasOne(d => d.InvReq).WithMany(p => p.InventoryItems).HasForeignKey(d => d.InvReqId).HasConstraintName("FK_inventory_items_request");
        });

        modelBuilder.Entity<InventoryRequest>(entity =>
        {
            entity.HasKey(e => e.InvReqId).HasName("PK__inventor__A56BE5DEA2C9FF70");
            entity.ToTable("inventory_requests", tb => tb.HasTrigger("TR_inventory_requests_updated_at"));
            entity.HasIndex(e => e.CreatedAt, "idx_inventory_requests_created_at");
            entity.HasIndex(e => e.RenterId, "idx_inventory_requests_renter");
            entity.HasIndex(e => e.Status, "idx_inventory_requests_status");
            entity.HasIndex(e => e.Type, "idx_inventory_requests_type");
            entity.HasIndex(e => e.WarehouseId, "idx_inventory_requests_warehouse");
            entity.Property(e => e.InvReqId).HasColumnName("inv_req_id");
            entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
            entity.Property(e => e.ConfirmedBy).HasColumnName("confirmed_by");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.Type).HasMaxLength(20).HasColumnName("type");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.ConfirmedByNavigation).WithMany(p => p.InventoryRequestConfirmedByNavigations).HasForeignKey(d => d.ConfirmedBy).HasConstraintName("FK_inventory_requests_confirmer");
            entity.HasOne(d => d.Renter).WithMany(p => p.InventoryRequestRenters).HasForeignKey(d => d.RenterId).HasConstraintName("FK_inventory_requests_renter");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.InventoryRequests).HasForeignKey(d => d.WarehouseId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_inventory_requests_warehouse");
        });

        modelBuilder.Entity<WarehouseInventory>(entity =>
        {
            entity.HasKey(e => e.InventoryId).HasName("PK_warehouse_inventory");
            entity.ToTable("warehouse_inventory");
            entity.HasIndex(e => new { e.WarehouseId, e.ItemName }, "UQ_warehouse_inventory_item").IsUnique();
            entity.Property(e => e.InventoryId).HasColumnName("inventory_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.ItemName).HasMaxLength(200).HasColumnName("item_name");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.Unit).HasMaxLength(50).HasDefaultValue("cái").HasColumnName("unit");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.HasOne(d => d.Warehouse).WithMany().HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_warehouse_inventory_wh");
        });

        modelBuilder.Entity<InventoryTransaction>(entity =>
        {
            entity.HasKey(e => e.TransactionId).HasName("PK_inventory_transactions");
            entity.ToTable("inventory_transactions");
            entity.HasIndex(e => e.WarehouseId, "idx_inv_transactions_warehouse");
            entity.HasIndex(e => e.Type, "idx_inv_transactions_type");
            entity.HasIndex(e => e.CreatedAt, "idx_inv_transactions_created");
            entity.Property(e => e.TransactionId).HasColumnName("transaction_id");
            entity.Property(e => e.InvReqId).HasColumnName("inv_req_id");
            entity.Property(e => e.Type).HasMaxLength(20).HasColumnName("type");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.ItemName).HasMaxLength(200).HasColumnName("item_name");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.Unit).HasMaxLength(50).HasDefaultValue("cái").HasColumnName("unit");
            entity.Property(e => e.PerformedBy).HasColumnName("performed_by");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.HasOne(d => d.InvReq).WithMany().HasForeignKey(d => d.InvReqId)
                .HasConstraintName("FK_inv_transactions_request");
            entity.HasOne(d => d.Warehouse).WithMany().HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_inv_transactions_warehouse");
            entity.HasOne(d => d.PerformedByNavigation).WithMany().HasForeignKey(d => d.PerformedBy)
                .HasConstraintName("FK_inv_transactions_performer");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__payments__ED1FC9EA910B49F8");
            entity.ToTable("payments", tb => tb.HasTrigger("TR_payments_overdue_check"));
            entity.HasIndex(e => e.ContractId, "idx_payments_contract");
            entity.HasIndex(e => e.DueDate, "idx_payments_due_date");
            entity.HasIndex(e => e.PaymentPeriod, "idx_payments_period");
            entity.HasIndex(e => e.Status, "idx_payments_status");
            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.Amount).HasColumnType("decimal(15, 2)").HasColumnName("amount");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.PaymentDate).HasDefaultValueSql("(getdate())").HasColumnName("payment_date");
            entity.Property(e => e.PaymentMethod).HasMaxLength(20).HasDefaultValue("TRANSFER").HasColumnName("payment_method");
            entity.Property(e => e.PaymentPeriod).HasMaxLength(7).HasColumnName("payment_period");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.TransactionReference).HasMaxLength(100).HasColumnName("transaction_reference");
            entity.HasOne(d => d.Contract).WithMany(p => p.Payments).HasForeignKey(d => d.ContractId).HasConstraintName("FK_payments_contract");
        });

        modelBuilder.Entity<Rating>(entity =>
        {
            entity.HasKey(e => e.RatingId).HasName("PK__ratings__D35B278BC49635DF");
            entity.ToTable("ratings", tb => tb.HasTrigger("TR_ratings_updated_at"));
            entity.HasIndex(e => e.CreatedAt, "idx_ratings_created_at");
            entity.HasIndex(e => e.RenterId, "idx_ratings_renter");
            entity.HasIndex(e => e.Star, "idx_ratings_star");
            entity.HasIndex(e => e.WarehouseId, "idx_ratings_warehouse");
            entity.Property(e => e.RatingId).HasColumnName("rating_id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.IsHidden).HasDefaultValue(false).HasColumnName("is_hidden");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.Star).HasColumnName("star");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.Contract).WithMany(p => p.Ratings).HasForeignKey(d => d.ContractId).HasConstraintName("FK_ratings_contract");
            entity.HasOne(d => d.Renter).WithMany(p => p.Ratings).HasForeignKey(d => d.RenterId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_ratings_renter");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.Ratings).HasForeignKey(d => d.WarehouseId).HasConstraintName("FK_ratings_warehouse");
        });

        modelBuilder.Entity<RentalRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__rental_r__18D3B90F92B6C93A");
            entity.ToTable("rental_requests", tb => tb.HasTrigger("TR_rental_requests_updated_at"));
            entity.HasIndex(e => e.CreatedAt, "idx_rental_requests_created_at");
            entity.HasIndex(e => e.RenterId, "idx_rental_requests_renter");
            entity.HasIndex(e => e.Status, "idx_rental_requests_status");
            entity.HasIndex(e => e.WarehouseId, "idx_rental_requests_warehouse");
            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.DurationMonths).HasColumnName("duration_months");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.RequestedArea).HasColumnName("requested_area");
            entity.Property(e => e.ReviewedAt).HasColumnName("reviewed_at");
            entity.Property(e => e.ReviewedBy).HasColumnName("reviewed_by");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.ContractImageUrl).HasMaxLength(500).HasColumnName("contract_image_url");
            entity.HasOne(d => d.Renter).WithMany(p => p.RentalRequestRenters).HasForeignKey(d => d.RenterId).HasConstraintName("FK_rental_requests_renter");
            entity.HasOne(d => d.ReviewedByNavigation).WithMany(p => p.RentalRequestReviewedByNavigations).HasForeignKey(d => d.ReviewedBy).HasConstraintName("FK_rental_requests_reviewer");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.RentalRequests).HasForeignKey(d => d.WarehouseId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_rental_requests_warehouse");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__roles__760965CC39FDE095");
            entity.ToTable("roles");
            entity.HasIndex(e => e.RoleName, "UQ__roles__783254B1C0716E85").IsUnique();
            entity.HasIndex(e => e.RoleName, "idx_role_name");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.RoleName).HasMaxLength(50).HasColumnName("role_name");
        });

        modelBuilder.Entity<WarehouseTask>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("task_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.TaskTypeId).HasColumnName("task_type_id");
            entity.Property(e => e.Status).HasMaxLength(30).HasColumnName("status");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.HasOne(e => e.Warehouse).WithMany(p => p.Tasks).HasForeignKey(e => e.WarehouseId);
            entity.HasOne(e => e.TaskType).WithMany(t => t.Tasks).HasForeignKey(e => e.TaskTypeId);
        });

        modelBuilder.Entity<WarehouseMembership>(entity =>
        {
            entity.ToTable("warehouse_memberships");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("membership_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.WarehouseRoleId).HasColumnName("warehouse_role_id");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("(getdate())");
            entity.HasIndex(e => new { e.UserId, e.WarehouseId }).IsUnique();
            entity.HasOne(e => e.User).WithMany(u => u.WarehouseMemberships).HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Warehouse).WithMany(w => w.WarehouseMemberships).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Role).WithMany(r => r.Memberships).HasForeignKey(e => e.WarehouseRoleId);
        });

        modelBuilder.Entity<WarehouseRole>(entity =>
        {
            entity.ToTable("warehouse_roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("role_id");
            entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
        });

        modelBuilder.Entity<Skill>(entity =>
        {
            entity.ToTable("skills");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("skill_id");
            entity.Property(e => e.Code).HasMaxLength(50).HasColumnName("code");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
        });

        modelBuilder.Entity<TaskType>(entity =>
        {
            entity.ToTable("task_types");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("task_type_id");
            entity.Property(e => e.Code).HasMaxLength(50).HasColumnName("code");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
        });

        modelBuilder.Entity<TaskAssignment>(entity =>
        {
            entity.ToTable("task_assignments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("assignment_id");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.MembershipId).HasColumnName("membership_id");
            entity.Property(e => e.AssignedAt).HasDefaultValueSql("(getdate())").HasColumnName("assigned_at");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            entity.HasOne(e => e.Task).WithMany(t => t.Assignments).HasForeignKey(e => e.TaskId);
            entity.HasOne(e => e.Membership).WithMany(m => m.TaskAssignments).HasForeignKey(e => e.MembershipId);
        });

        modelBuilder.Entity<WarehouseMembership>()
            .HasMany(m => m.Skills)
            .WithMany(s => s.Memberships)
            .UsingEntity<Dictionary<string, object>>(
                "warehouse_membership_skills",
                j => j.HasOne<Skill>().WithMany().HasForeignKey("skill_id"),
                j => j.HasOne<WarehouseMembership>().WithMany().HasForeignKey("membership_id"),
                j => { j.HasKey("membership_id", "skill_id"); });

        modelBuilder.Entity<TaskType>()
            .HasMany(t => t.RequiredSkills)
            .WithMany(s => s.TaskTypes)
            .UsingEntity<Dictionary<string, object>>(
                "task_type_skills",
                j => j.HasOne<Skill>().WithMany().HasForeignKey("skill_id"),
                j => j.HasOne<TaskType>().WithMany().HasForeignKey("task_type_id"),
                j => { j.HasKey("task_type_id", "skill_id"); });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__users__B9BE370FD71B3418");
            entity.ToTable("users", tb => tb.HasTrigger("TR_users_updated_at"));
            entity.HasIndex(e => e.Email, "UQ__users__AB6E616480871272").IsUnique();
            entity.HasIndex(e => e.CreatedAt, "idx_users_created_at");
            entity.HasIndex(e => e.Email, "idx_users_email");
            entity.HasIndex(e => e.RoleId, "idx_users_role");
            entity.HasIndex(e => e.Status, "idx_users_status");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.Email).HasMaxLength(100).HasColumnName("email");
            entity.Property(e => e.FullName).HasMaxLength(100).HasColumnName("full_name");
            entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(e => e.PasswordHash).HasMaxLength(255).HasColumnName("password_hash");
            entity.Property(e => e.Phone).HasMaxLength(20).HasColumnName("phone");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.HasOne(d => d.Role).WithMany(p => p.Users).HasForeignKey(d => d.RoleId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_users_roles");
        });

        modelBuilder.Entity<VActiveWarehouse>(entity =>
        {
            entity.HasNoKey().ToView("v_active_warehouses");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.AvailableArea).HasColumnName("available_area");
            entity.Property(e => e.AvgRating).HasColumnName("avg_rating");
            entity.Property(e => e.Lat).HasColumnName("lat");
            entity.Property(e => e.Lng).HasColumnName("lng");
            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name");
            entity.Property(e => e.OperatingHours).HasMaxLength(100).HasColumnName("operating_hours");
            entity.Property(e => e.OwnerEmail).HasMaxLength(100).HasColumnName("owner_email");
            entity.Property(e => e.OwnerName).HasMaxLength(100).HasColumnName("owner_name");
            entity.Property(e => e.OwnerPhone).HasMaxLength(20).HasColumnName("owner_phone");
            entity.Property(e => e.TotalArea).HasColumnName("total_area");
            entity.Property(e => e.TotalRatings).HasColumnName("total_ratings");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
        });

        modelBuilder.Entity<VContractPayment>(entity =>
        {
            entity.HasNoKey().ToView("v_contract_payments");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.ContractNumber).HasMaxLength(100).HasColumnName("contract_number");
            entity.Property(e => e.ContractStatus).HasMaxLength(20).HasColumnName("contract_status");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.MonthlyPayment).HasColumnType("decimal(15, 2)").HasColumnName("monthly_payment");
            entity.Property(e => e.OverdueAmount).HasColumnType("decimal(38, 2)").HasColumnName("overdue_amount");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(38, 2)").HasColumnName("paid_amount");
            entity.Property(e => e.PendingAmount).HasColumnType("decimal(38, 2)").HasColumnName("pending_amount");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.RenterName).HasMaxLength(100).HasColumnName("renter_name");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.TotalPayments).HasColumnName("total_payments");
            entity.Property(e => e.TotalValue).HasColumnType("decimal(15, 2)").HasColumnName("total_value");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.WarehouseName).HasMaxLength(255).HasColumnName("warehouse_name");
        });

        modelBuilder.Entity<VWarehouseOccupancy>(entity =>
        {
            entity.HasNoKey().ToView("v_warehouse_occupancy");
            entity.Property(e => e.AvailableArea).HasColumnName("available_area");
            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name");
            entity.Property(e => e.OccupancyRate).HasColumnName("occupancy_rate");
            entity.Property(e => e.OccupiedArea).HasColumnName("occupied_area");
            entity.Property(e => e.TotalArea).HasColumnName("total_area");
            entity.Property(e => e.WarehouseId).ValueGeneratedOnAdd().HasColumnName("warehouse_id");
        });

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasKey(e => e.WarehouseId).HasName("PK__warehous__734FE6BFFBD35973");
            entity.ToTable("warehouses", tb => tb.HasTrigger("TR_warehouses_updated_at"));
            entity.HasIndex(e => e.CreatedAt, "idx_warehouses_created_at");
            entity.HasIndex(e => new { e.Lat, e.Lng }, "idx_warehouses_location");
            entity.HasIndex(e => e.OwnerId, "idx_warehouses_owner");
            entity.HasIndex(e => e.Status, "idx_warehouses_status");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
            entity.Property(e => e.AvailableArea).HasColumnName("available_area");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Lat).HasColumnName("lat");
            entity.Property(e => e.Lng).HasColumnName("lng");
            entity.Property(e => e.Name).HasMaxLength(255).HasColumnName("name");
            entity.Property(e => e.OperatingHours).HasMaxLength(100).HasColumnName("operating_hours");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.TotalArea).HasColumnName("total_area");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.HasOne(d => d.ApprovedByNavigation).WithMany(p => p.WarehouseApprovedByNavigations).HasForeignKey(d => d.ApprovedBy).HasConstraintName("FK_warehouses_approver");
            entity.HasOne(d => d.Owner).WithMany(p => p.WarehouseOwners).HasForeignKey(d => d.OwnerId).HasConstraintName("FK_warehouses_owner");
        });

        modelBuilder.Entity<WarehouseDocument>(entity =>
        {
            entity.HasKey(e => e.DocumentId).HasName("PK__warehous__9666E8AC2F6AB1C2");
            entity.ToTable("warehouse_documents");
            entity.Property(e => e.DocumentId).HasColumnName("document_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.DocumentNumber).HasMaxLength(100).HasColumnName("document_number");
            entity.Property(e => e.DocumentType).HasMaxLength(50).HasColumnName("document_type");
            entity.Property(e => e.DocumentUrl).HasColumnName("document_url");
            entity.Property(e => e.ExpiryDate).HasColumnName("expiry_date");
            entity.Property(e => e.IssuedDate).HasColumnName("issued_date");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.VerifiedAt).HasColumnName("verified_at");
            entity.Property(e => e.VerifiedBy).HasColumnName("verified_by");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.VerifiedByNavigation).WithMany(p => p.WarehouseDocuments).HasForeignKey(d => d.VerifiedBy).HasConstraintName("FK_warehouse_documents_verifier");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.WarehouseDocuments).HasForeignKey(d => d.WarehouseId).HasConstraintName("FK_warehouse_documents_warehouse");
        });

        modelBuilder.Entity<WarehouseMedium>(entity =>
        {
            entity.HasKey(e => e.MediaId).HasName("PK__warehous__D0A840F42AF1FBBB");
            entity.ToTable("warehouse_media");
            entity.HasIndex(e => new { e.WarehouseId, e.DisplayOrder }, "idx_warehouse_media_order");
            entity.HasIndex(e => e.WarehouseId, "idx_warehouse_media_warehouse");
            entity.Property(e => e.MediaId).HasColumnName("media_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0).HasColumnName("display_order");
            entity.Property(e => e.IsPrimary).HasDefaultValue(false).HasColumnName("is_primary");
            entity.Property(e => e.MediaType).HasMaxLength(20).HasColumnName("media_type");
            entity.Property(e => e.MediaUrl).HasColumnName("media_url");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.WarehouseMedia).HasForeignKey(d => d.WarehouseId).HasConstraintName("FK_warehouse_media_warehouse");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.TokenId).HasName("PK__password_reset_tokens");
            entity.ToTable("password_reset_tokens");
            entity.HasIndex(e => e.Token, "idx_prt_token").IsUnique();
            entity.HasIndex(e => e.UserId, "idx_prt_user_id");
            entity.Property(e => e.TokenId).HasColumnName("token_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Token).HasMaxLength(256).HasColumnName("token");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.IsUsed).HasDefaultValue(false).HasColumnName("is_used");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.HasOne(d => d.User).WithMany().HasForeignKey(d => d.UserId).HasConstraintName("FK_password_reset_tokens_user");
        });
    }
}
