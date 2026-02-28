using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;

using WMS.Application.Common.Interfaces;

namespace WMS.Infrastructure.Data;

public partial class WMSContext : DbContext, IApplicationDbContext
{
    public WMSContext()
    {
    }

    public WMSContext(DbContextOptions<WMSContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AuditSession> AuditSessions { get; set; }

    public virtual DbSet<Contract> Contracts { get; set; }

    public virtual DbSet<Equipment> Equipments { get; set; }

    public virtual DbSet<InventoryItem> InventoryItems { get; set; }

    public virtual DbSet<InventoryRequest> InventoryRequests { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Rating> Ratings { get; set; }

    public virtual DbSet<RentalArea> RentalAreas { get; set; }

    public virtual DbSet<RentalRequest> RentalRequests { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<StaffAssignment> StaffAssignments { get; set; }

    public virtual DbSet<WmsTask> Tasks { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<VActiveWarehouse> VActiveWarehouses { get; set; }

    public virtual DbSet<VContractPayment> VContractPayments { get; set; }

    public virtual DbSet<VWarehouseOccupancy> VWarehouseOccupancies { get; set; }

    public virtual DbSet<Warehouse> Warehouses { get; set; }

    public virtual DbSet<WarehouseMedium> WarehouseMedia { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // The connection string will be provided via DI in the API layer.
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditSession>(entity =>
        {
            entity.HasKey(e => e.AuditId).HasName("PK__audit_se__5AF33E33AFD17D56");

            entity.ToTable("audit_sessions");

            entity.HasIndex(e => e.CreatedAt, "idx_audit_sessions_created_at");

            entity.HasIndex(e => e.Status, "idx_audit_sessions_status");

            entity.HasIndex(e => e.WarehouseId, "idx_audit_sessions_warehouse");

            entity.Property(e => e.AuditId).HasColumnName("audit_id");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("OPEN")
                .HasColumnName("status");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.AuditSessions)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_audit_sessions_creator");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.AuditSessions)
                .HasForeignKey(d => d.WarehouseId)
                .HasConstraintName("FK_audit_sessions_warehouse");
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.ContractId).HasName("PK__contract__F8D6642301E374D6");

            entity.ToTable("contracts", tb => tb.HasTrigger("TR_contracts_updated_at"));

            entity.HasIndex(e => e.ContractNumber, "UQ__contract__1CA37CCEC975F01E").IsUnique();

            entity.HasIndex(e => new { e.StartDate, e.EndDate }, "idx_contracts_dates");

            entity.HasIndex(e => e.RenterId, "idx_contracts_renter");

            entity.HasIndex(e => e.RequestId, "idx_contracts_request");

            entity.HasIndex(e => e.Status, "idx_contracts_status");

            entity.HasIndex(e => e.WarehouseId, "idx_contracts_warehouse");

            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.ContractNumber)
                .HasMaxLength(100)
                .HasColumnName("contract_number");
            entity.Property(e => e.ContractUrl).HasColumnName("contract_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DepositAmount)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("deposit_amount");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.MonthlyPayment)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("monthly_payment");
            entity.Property(e => e.RentalAreaId).HasColumnName("rental_area_id");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("ACTIVE")
                .HasColumnName("status");
            entity.Property(e => e.TerminatedAt).HasColumnName("terminated_at");
            entity.Property(e => e.TerminationReason).HasColumnName("termination_reason");
            entity.Property(e => e.TotalValue)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("total_value");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.RentalArea).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.RentalAreaId)
                .HasConstraintName("FK_contracts_rental_area");

            entity.HasOne(d => d.Renter).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.RenterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_contracts_renter");

            entity.HasOne(d => d.Request).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.RequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_contracts_request");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_contracts_warehouse");
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.EquipmentId).HasName("PK__equipmen__197068AFCC9FD770");

            entity.ToTable("equipments", tb => tb.HasTrigger("TR_equipments_updated_at"));

            entity.HasIndex(e => e.IotDeviceId, "idx_equipments_iot");

            entity.HasIndex(e => e.Status, "idx_equipments_status");

            entity.HasIndex(e => e.WarehouseId, "idx_equipments_warehouse");

            entity.Property(e => e.EquipmentId).HasColumnName("equipment_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.IotDeviceId)
                .HasMaxLength(100)
                .HasColumnName("iot_device_id");
            entity.Property(e => e.LastMaintenanceDate).HasColumnName("last_maintenance_date");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.NextMaintenanceDate).HasColumnName("next_maintenance_date");
            entity.Property(e => e.PurchaseDate).HasColumnName("purchase_date");
            entity.Property(e => e.Specifications).HasColumnName("specifications");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("ACTIVE")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.Equipment)
                .HasForeignKey(d => d.WarehouseId)
                .HasConstraintName("FK_equipments_warehouse");
        });

        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.HasKey(e => e.ItemId).HasName("PK__inventor__52020FDD36C35D03");

            entity.ToTable("inventory_items");

            entity.HasIndex(e => e.InvReqId, "idx_inventory_items_request");

            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.InvReqId).HasColumnName("inv_req_id");
            entity.Property(e => e.ItemName)
                .HasMaxLength(255)
                .HasColumnName("item_name");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.Unit)
                .HasMaxLength(50)
                .HasColumnName("unit");
            entity.Property(e => e.Weight)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("weight");

            entity.HasOne(d => d.InvReq).WithMany(p => p.InventoryItems)
                .HasForeignKey(d => d.InvReqId)
                .HasConstraintName("FK_inventory_items_request");
        });

        modelBuilder.Entity<InventoryRequest>(entity =>
        {
            entity.HasKey(e => e.InvReqId).HasName("PK__inventor__A56BE5DE947075FF");

            entity.ToTable("inventory_requests", tb => tb.HasTrigger("TR_inventory_requests_updated_at"));

            entity.HasIndex(e => e.CreatedAt, "idx_inventory_requests_created_at");

            entity.HasIndex(e => e.RenterId, "idx_inventory_requests_renter");

            entity.HasIndex(e => e.Status, "idx_inventory_requests_status");

            entity.HasIndex(e => e.Type, "idx_inventory_requests_type");

            entity.HasIndex(e => e.WarehouseId, "idx_inventory_requests_warehouse");

            entity.Property(e => e.InvReqId).HasColumnName("inv_req_id");
            entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
            entity.Property(e => e.ConfirmedBy).HasColumnName("confirmed_by");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.RentalAreaId).HasColumnName("rental_area_id");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.ConfirmedByNavigation).WithMany(p => p.InventoryRequestConfirmedByNavigations)
                .HasForeignKey(d => d.ConfirmedBy)
                .HasConstraintName("FK_inventory_requests_confirmer");

            entity.HasOne(d => d.RentalArea).WithMany(p => p.InventoryRequests)
                .HasForeignKey(d => d.RentalAreaId)
                .HasConstraintName("FK_inventory_requests_rental_area");

            entity.HasOne(d => d.Renter).WithMany(p => p.InventoryRequestRenters)
                .HasForeignKey(d => d.RenterId)
                .HasConstraintName("FK_inventory_requests_renter");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.InventoryRequests)
                .HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_inventory_requests_warehouse");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__payments__ED1FC9EA1246D0B5");

            entity.ToTable("payments", tb => tb.HasTrigger("TR_payments_overdue_check"));

            entity.HasIndex(e => e.ContractId, "idx_payments_contract");

            entity.HasIndex(e => e.DueDate, "idx_payments_due_date");

            entity.HasIndex(e => e.PaymentPeriod, "idx_payments_period");

            entity.HasIndex(e => e.Status, "idx_payments_status");

            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("amount");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.PaymentDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("payment_date");
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(20)
                .HasDefaultValue("TRANSFER")
                .HasColumnName("payment_method");
            entity.Property(e => e.PaymentPeriod)
                .HasMaxLength(7)
                .HasColumnName("payment_period");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.TransactionReference)
                .HasMaxLength(100)
                .HasColumnName("transaction_reference");

            entity.HasOne(d => d.Contract).WithMany(p => p.Payments)
                .HasForeignKey(d => d.ContractId)
                .HasConstraintName("FK_payments_contract");
        });

        modelBuilder.Entity<Rating>(entity =>
        {
            entity.HasKey(e => e.RatingId).HasName("PK__ratings__D35B278B6D54EE89");

            entity.ToTable("ratings", tb => tb.HasTrigger("TR_ratings_updated_at"));

            entity.HasIndex(e => e.CreatedAt, "idx_ratings_created_at");

            entity.HasIndex(e => e.RenterId, "idx_ratings_renter");

            entity.HasIndex(e => e.Star, "idx_ratings_star");

            entity.HasIndex(e => e.WarehouseId, "idx_ratings_warehouse");

            entity.Property(e => e.RatingId).HasColumnName("rating_id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.IsHidden)
                .HasDefaultValue(false)
                .HasColumnName("is_hidden");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.Star).HasColumnName("star");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.Contract).WithMany(p => p.Ratings)
                .HasForeignKey(d => d.ContractId)
                .HasConstraintName("FK_ratings_contract");

            entity.HasOne(d => d.Renter).WithMany(p => p.Ratings)
                .HasForeignKey(d => d.RenterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ratings_renter");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.Ratings)
                .HasForeignKey(d => d.WarehouseId)
                .HasConstraintName("FK_ratings_warehouse");
        });

        modelBuilder.Entity<RentalArea>(entity =>
        {
            entity.HasKey(e => e.AreaId).HasName("PK__rental_a__985D6D6B3ABFD123");

            entity.ToTable("rental_areas", tb =>
                {
                    tb.HasTrigger("TR_rental_area_insert_update_warehouse");
                    tb.HasTrigger("TR_rental_area_update_warehouse");
                    tb.HasTrigger("TR_rental_areas_updated_at");
                });

            entity.HasIndex(e => new { e.StartDate, e.EndDate }, "idx_rental_areas_dates");

            entity.HasIndex(e => e.RenterId, "idx_rental_areas_renter");

            entity.HasIndex(e => e.Status, "idx_rental_areas_status");

            entity.HasIndex(e => e.WarehouseId, "idx_rental_areas_warehouse");

            entity.Property(e => e.AreaId).HasColumnName("area_id");
            entity.Property(e => e.AreaSize).HasColumnName("area_size");
            entity.Property(e => e.CancellationReason).HasColumnName("cancellation_reason");
            entity.Property(e => e.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.PricePerMonth)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("price_per_month");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("ACTIVE")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.Renter).WithMany(p => p.RentalAreas)
                .HasForeignKey(d => d.RenterId)
                .HasConstraintName("FK_rental_areas_renter");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.RentalAreas)
                .HasForeignKey(d => d.WarehouseId)
                .HasConstraintName("FK_rental_areas_warehouse");
        });

        modelBuilder.Entity<RentalRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__rental_r__18D3B90F6F468799");

            entity.ToTable("rental_requests", tb => tb.HasTrigger("TR_rental_requests_updated_at"));

            entity.HasIndex(e => e.CreatedAt, "idx_rental_requests_created_at");

            entity.HasIndex(e => e.RenterId, "idx_rental_requests_renter");

            entity.HasIndex(e => e.Status, "idx_rental_requests_status");

            entity.HasIndex(e => e.WarehouseId, "idx_rental_requests_warehouse");

            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DurationMonths).HasColumnName("duration_months");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.RequestedArea).HasColumnName("requested_area");
            entity.Property(e => e.ReviewedAt).HasColumnName("reviewed_at");
            entity.Property(e => e.ReviewedBy).HasColumnName("reviewed_by");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.Renter).WithMany(p => p.RentalRequestRenters)
                .HasForeignKey(d => d.RenterId)
                .HasConstraintName("FK_rental_requests_renter");

            entity.HasOne(d => d.ReviewedByNavigation).WithMany(p => p.RentalRequestReviewedByNavigations)
                .HasForeignKey(d => d.ReviewedBy)
                .HasConstraintName("FK_rental_requests_reviewer");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.RentalRequests)
                .HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_rental_requests_warehouse");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__roles__760965CCD396D4C5");

            entity.ToTable("roles");

            entity.HasIndex(e => e.RoleName, "UQ__roles__783254B1958523CC").IsUnique();

            entity.HasIndex(e => e.RoleName, "idx_role_name");

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.RoleName)
                .HasMaxLength(50)
                .HasColumnName("role_name");
        });

        modelBuilder.Entity<StaffAssignment>(entity =>
        {
            entity.HasKey(e => e.AssignmentId).HasName("PK__staff_as__DA891814FCC6442C");

            entity.ToTable("staff_assignments");

            entity.HasIndex(e => new { e.StaffId, e.WarehouseId, e.Status }, "UQ_staff_assignments").IsUnique();

            entity.HasIndex(e => e.StaffId, "idx_staff_assignments_staff");

            entity.HasIndex(e => e.Status, "idx_staff_assignments_status");

            entity.HasIndex(e => e.WarehouseId, "idx_staff_assignments_warehouse");

            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("assigned_at");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("ACTIVE")
                .HasColumnName("status");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffAssignments)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("FK_staff_assignments_staff");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.StaffAssignments)
                .HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_staff_assignments_warehouse");
        });

        modelBuilder.Entity<WmsTask>(entity =>
        {
            entity.HasKey(e => e.TaskId).HasName("PK__tasks__0492148D4E28D480");

            entity.ToTable("tasks", tb => tb.HasTrigger("TR_tasks_updated_at"));

            entity.HasIndex(e => e.AssigneeId, "idx_tasks_assignee");

            entity.HasIndex(e => e.Deadline, "idx_tasks_deadline");

            entity.HasIndex(e => e.Priority, "idx_tasks_priority");

            entity.HasIndex(e => e.Status, "idx_tasks_status");

            entity.HasIndex(e => e.WarehouseId, "idx_tasks_warehouse");

            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.AssigneeId).HasColumnName("assignee_id");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Deadline).HasColumnName("deadline");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Priority)
                .HasMaxLength(20)
                .HasDefaultValue("MEDIUM")
                .HasColumnName("priority");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("TODO")
                .HasColumnName("status");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.Assignee).WithMany(p => p.TaskAssignees)
                .HasForeignKey(d => d.AssigneeId)
                .HasConstraintName("FK_tasks_assignee");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.TaskCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_tasks_creator");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.WarehouseId)
                .HasConstraintName("FK_tasks_warehouse");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__users__B9BE370FEFBAE0BC");

            entity.ToTable("users", tb => tb.HasTrigger("TR_users_updated_at"));

            entity.HasIndex(e => e.Email, "UQ__users__AB6E61646A5C9E5C").IsUnique();

            entity.HasIndex(e => e.CreatedAt, "idx_users_created_at");

            entity.HasIndex(e => e.Email, "idx_users_email");

            entity.HasIndex(e => e.RoleId, "idx_users_role");

            entity.HasIndex(e => e.Status, "idx_users_status");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.FullName)
                .HasMaxLength(100)
                .HasColumnName("full_name");
            entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .HasColumnName("phone");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_users_roles");
        });

        modelBuilder.Entity<VActiveWarehouse>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_active_warehouses");

            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.AvailableArea).HasColumnName("available_area");
            entity.Property(e => e.AvgRating).HasColumnName("avg_rating");
            entity.Property(e => e.Lat).HasColumnName("lat");
            entity.Property(e => e.Lng).HasColumnName("lng");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.OperatingHours)
                .HasMaxLength(100)
                .HasColumnName("operating_hours");
            entity.Property(e => e.OwnerEmail)
                .HasMaxLength(100)
                .HasColumnName("owner_email");
            entity.Property(e => e.OwnerName)
                .HasMaxLength(100)
                .HasColumnName("owner_name");
            entity.Property(e => e.OwnerPhone)
                .HasMaxLength(20)
                .HasColumnName("owner_phone");
            entity.Property(e => e.TotalArea).HasColumnName("total_area");
            entity.Property(e => e.TotalRatings).HasColumnName("total_ratings");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
        });

        modelBuilder.Entity<VContractPayment>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_contract_payments");

            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.ContractNumber)
                .HasMaxLength(100)
                .HasColumnName("contract_number");
            entity.Property(e => e.ContractStatus)
                .HasMaxLength(20)
                .HasColumnName("contract_status");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.MonthlyPayment)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("monthly_payment");
            entity.Property(e => e.OverdueAmount)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("overdue_amount");
            entity.Property(e => e.PaidAmount)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("paid_amount");
            entity.Property(e => e.PendingAmount)
                .HasColumnType("decimal(38, 2)")
                .HasColumnName("pending_amount");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.RenterName)
                .HasMaxLength(100)
                .HasColumnName("renter_name");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.TotalPayments).HasColumnName("total_payments");
            entity.Property(e => e.TotalValue)
                .HasColumnType("decimal(15, 2)")
                .HasColumnName("total_value");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.WarehouseName)
                .HasMaxLength(255)
                .HasColumnName("warehouse_name");
        });

        modelBuilder.Entity<VWarehouseOccupancy>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_warehouse_occupancy");

            entity.Property(e => e.AvailableArea).HasColumnName("available_area");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.OccupancyRate).HasColumnName("occupancy_rate");
            entity.Property(e => e.OccupiedArea).HasColumnName("occupied_area");
            entity.Property(e => e.TotalArea).HasColumnName("total_area");
            entity.Property(e => e.WarehouseId)
                .ValueGeneratedOnAdd()
                .HasColumnName("warehouse_id");
        });

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasKey(e => e.WarehouseId).HasName("PK__warehous__734FE6BF5AE59359");

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
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Lat).HasColumnName("lat");
            entity.Property(e => e.Lng).HasColumnName("lng");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.OperatingHours)
                .HasMaxLength(100)
                .HasColumnName("operating_hours");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.TotalArea).HasColumnName("total_area");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.ApprovedByNavigation).WithMany(p => p.WarehouseApprovedByNavigations)
                .HasForeignKey(d => d.ApprovedBy)
                .HasConstraintName("FK_warehouses_approver");

            entity.HasOne(d => d.Owner).WithMany(p => p.WarehouseOwners)
                .HasForeignKey(d => d.OwnerId)
                .HasConstraintName("FK_warehouses_owner");
        });

        modelBuilder.Entity<WarehouseMedium>(entity =>
        {
            entity.HasKey(e => e.MediaId).HasName("PK__warehous__D0A840F4BD2D17DF");

            entity.ToTable("warehouse_media");

            entity.HasIndex(e => new { e.WarehouseId, e.DisplayOrder }, "idx_warehouse_media_order");

            entity.HasIndex(e => e.WarehouseId, "idx_warehouse_media_warehouse");

            entity.Property(e => e.MediaId).HasColumnName("media_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.IsPrimary)
                .HasDefaultValue(false)
                .HasColumnName("is_primary");
            entity.Property(e => e.MediaType)
                .HasMaxLength(20)
                .HasColumnName("media_type");
            entity.Property(e => e.MediaUrl).HasColumnName("media_url");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");

            entity.HasOne(d => d.Warehouse).WithMany(p => p.WarehouseMedia)
                .HasForeignKey(d => d.WarehouseId)
                .HasConstraintName("FK_warehouse_media_warehouse");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
