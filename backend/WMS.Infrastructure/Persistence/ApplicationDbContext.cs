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
    public virtual DbSet<EquipmentHistory> EquipmentHistories { get; set; }
    public virtual DbSet<EquipmentMaintenanceRecord> EquipmentMaintenanceRecords { get; set; }
    public virtual DbSet<EquipmentIncident> EquipmentIncidents { get; set; }
    public virtual DbSet<EquipmentIncidentComment> EquipmentIncidentComments { get; set; }
    public virtual DbSet<EquipmentIncidentAttachment> EquipmentIncidentAttachments { get; set; }

    public virtual DbSet<InventoryItem> InventoryItems { get; set; }

    public virtual DbSet<InventoryRequest> InventoryRequests { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<RentalPayment> RentalPayments { get; set; }

    public virtual DbSet<RentalContract> RentalContracts { get; set; }

    public virtual DbSet<WarehouseReturn> WarehouseReturns { get; set; }

    public virtual DbSet<ContractExtension> ContractExtensions { get; set; }

    public virtual DbSet<Rating> Ratings { get; set; }

    public virtual DbSet<RentalRequest> RentalRequests { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<WarehouseMembership> WarehouseMemberships { get; set; }

    public virtual DbSet<WarehouseRole> WarehouseRoles { get; set; }

    public virtual DbSet<Zone> Zones { get; set; }

    public virtual DbSet<Skill> Skills { get; set; }

    public virtual DbSet<TaskType> TaskTypes { get; set; }

    public virtual DbSet<WarehouseTask> WarehouseTasks { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<VActiveWarehouse> VActiveWarehouses { get; set; }

    public virtual DbSet<VContractPayment> VContractPayments { get; set; }

    public virtual DbSet<VWarehouseOccupancy> VWarehouseOccupancies { get; set; }

    public virtual DbSet<Subscription> Subscriptions { get; set; }

    public virtual DbSet<SubscriptionPackage> SubscriptionPackages { get; set; }

    public virtual DbSet<Warehouse> Warehouses { get; set; }

    public virtual DbSet<WarehouseDocument> WarehouseDocuments { get; set; }

    public virtual DbSet<WarehouseMedium> WarehouseMedia { get; set; }

    public virtual DbSet<WarehouseInventory> WarehouseInventories { get; set; }

    public virtual DbSet<InventoryTransaction> InventoryTransactions { get; set; }

    public virtual DbSet<RentalArea> RentalAreas { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<ContractVerification> ContractVerifications { get; set; }

    public virtual DbSet<ContractLog> ContractLogs { get; set; }
    
    public virtual DbSet<CancellationLog> CancellationLogs { get; set; }
    
    public virtual DbSet<Refund> Refunds { get; set; }

    public virtual DbSet<StaffShift> StaffShifts { get; set; }

    public virtual DbSet<WarehouseShift> WarehouseShifts { get; set; }

    public virtual DbSet<RenterAsset> RenterAssets { get; set; }

    public virtual DbSet<RenterInventory> RenterInventories { get; set; }

    public virtual DbSet<UnitTask> UnitTasks { get; set; }

    public virtual DbSet<AiAnalysisSession> AiAnalysisSessions { get; set; }

    public virtual DbSet<WarehouseGridLocation> WarehouseGridLocations { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(warnings =>
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        // if (!optionsBuilder.IsConfigured)
        // {
        //     optionsBuilder.UseSqlServer("Server=localhost;Database=OWRMS;uid=sa;pwd=sa;Trusted_Connection=True;TrustServerCertificate=True;");
        // }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var relationship in modelBuilder.Model.GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.NoAction;
        }

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
            entity.Property(e => e.RecordedBy).HasColumnName("recorded_by");
            entity.HasOne(d => d.Audit).WithMany(p => p.AuditResults).HasForeignKey(d => d.AuditId).HasConstraintName("FK_audit_results_audit");
            entity.HasOne(d => d.RecordedByNavigation).WithMany(p => p.RecordedAuditResults).HasForeignKey(d => d.RecordedBy).HasConstraintName("FK_audit_results_recorded_by");
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
            entity.Property(e => e.AssignedTo).HasColumnName("assigned_to");
            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.AuditSessions).HasForeignKey(d => d.CreatedBy).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_audit_sessions_creator");
            entity.HasOne(d => d.AssignedToNavigation).WithMany(p => p.AssignedAuditSessions).HasForeignKey(d => d.AssignedTo).HasConstraintName("FK_audit_sessions_assigned_to");
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
            entity.Property(e => e.SignedFileUrl).HasMaxLength(500).HasColumnName("signed_file_url");
            entity.Property(e => e.SignedAt).HasColumnName("signed_at");
            entity.Property(e => e.Terms).HasColumnName("terms");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.DepositAmount).HasColumnType("decimal(15, 2)").HasColumnName("deposit_amount");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.MonthlyPayment).HasColumnType("decimal(15, 2)").HasColumnName("monthly_payment");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.RequestId).HasColumnName("request_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("PENDING_OWNER_SIGNATURE").HasColumnName("status");
            entity.Property(e => e.OwnerSignedFileUrl).HasMaxLength(500).HasColumnName("owner_signed_file_url");
            entity.Property(e => e.OwnerSignedAt).HasColumnName("owner_signed_at");
            entity.Property(e => e.OwnerSignatureBase64).HasColumnName("owner_signature_base64");
            entity.Property(e => e.RenterSignatureBase64).HasColumnName("renter_signature_base64");
            entity.Property(e => e.TerminationRequestedBy).HasMaxLength(20).HasColumnName("termination_requested_by");
            entity.Property(e => e.TerminationRequestedAt).HasColumnName("termination_requested_at");
            entity.Property(e => e.RenterApprovedTermination).HasDefaultValue(false).HasColumnName("renter_approved_termination");
            entity.Property(e => e.OwnerApprovedTermination).HasDefaultValue(false).HasColumnName("owner_approved_termination");
            entity.Property(e => e.EarlyTerminationFee).HasColumnType("decimal(15, 2)").HasColumnName("early_termination_fee");
            entity.Property(e => e.TotalValue).HasColumnType("decimal(15, 2)").HasColumnName("total_value");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.HasOne(d => d.Renter).WithMany(p => p.Contracts).HasForeignKey(d => d.RenterId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_contracts_renter");
            entity.HasOne(d => d.Request).WithMany(p => p.Contracts).HasForeignKey(d => d.RequestId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_contracts_request");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.Contracts).HasForeignKey(d => d.WarehouseId).OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_contracts_warehouse");

            // TODO: Fix Contract entity configuration - temporary comment out due to type resolution issues
            // Configure many-to-many relationship with Equipment
            /*
            entity.HasMany<WMS.Domain.Entities.Equipment>(c => c.IncludedEquipments)
                .WithMany(e => e.RentalContracts)
                .UsingEntity<Dictionary<string, object>>(
                    "rental_contract_equipments",
                    j => j.HasOne<WMS.Domain.Entities.Equipment>().WithMany().HasForeignKey("equipment_id"),
                    j => j.HasOne<WMS.Domain.Entities.Contract>().WithMany().HasForeignKey("contract_id"),
                    j => { j.HasKey("contract_id", "equipment_id"); });
            */
        });

        modelBuilder.Entity<ContractExtension>(entity =>
        {
            entity.HasKey(e => e.ExtensionId);
            entity.ToTable("contract_extensions");
            entity.Property(e => e.ExtensionId).HasColumnName("extension_id");
            entity.Property(e => e.OriginalContractId).HasColumnName("original_contract_id");
            entity.Property(e => e.NewContractId).HasColumnName("new_contract_id");
            entity.Property(e => e.RequesterId).HasColumnName("requester_id");
            entity.Property(e => e.DurationMonths).HasColumnName("duration_months");
            entity.Property(e => e.ProposedMonthlyPayment).HasColumnType("decimal(15, 2)").HasColumnName("proposed_monthly_payment");
            entity.Property(e => e.Status).HasMaxLength(30).HasColumnName("status");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.RequestedAt).HasColumnName("requested_at");
            entity.Property(e => e.ReviewedAt).HasColumnName("reviewed_at");
            entity.Property(e => e.ReviewedBy).HasColumnName("reviewed_by");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(d => d.OriginalContract).WithMany().HasForeignKey(d => d.OriginalContractId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.NewContract).WithMany().HasForeignKey(d => d.NewContractId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.Requester).WithMany().HasForeignKey(d => d.RequesterId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.Reviewer).WithMany().HasForeignKey(d => d.ReviewedBy).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<RentalContract>(entity =>
        {
            entity.HasKey(e => e.ContractId);
            entity.ToTable("rental_contracts");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.RentalRequestId).HasColumnName("rental_request_id");
            entity.Property(e => e.ContractNumber).HasMaxLength(100).HasColumnName("contract_number");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.MonthlyPayment).HasColumnType("decimal(15, 2)").HasColumnName("monthly_payment");
            entity.Property(e => e.TotalValue).HasColumnType("decimal(15, 2)").HasColumnName("total_value");
            entity.Property(e => e.DepositAmount).HasColumnType("decimal(15, 2)").HasColumnName("deposit_amount");
            entity.Property(e => e.CancellationFee).HasColumnType("decimal(18, 2)").HasColumnName("CancellationFee");
            entity.Property(e => e.EarlyTerminationFee).HasColumnType("decimal(18, 2)").HasColumnName("EarlyTerminationFee");
            entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("status");
            entity.Property(e => e.Terms).HasColumnName("terms");
            entity.Property(e => e.ContractFileUrl).HasMaxLength(500).HasColumnName("contract_file_url");
            entity.Property(e => e.SignedFileUrl).HasMaxLength(500).HasColumnName("signed_file_url");
            entity.Property(e => e.SignedAt).HasColumnName("signed_at");
            entity.Property(e => e.OwnerSignedFileUrl).HasMaxLength(500).HasColumnName("owner_signed_file_url");
            entity.Property(e => e.OwnerSignedAt).HasColumnName("owner_signed_at");
            entity.Property(e => e.OwnerSignatureBase64).HasColumnName("owner_signature_base64");
            entity.Property(e => e.RenterSignatureBase64).HasColumnName("renter_signature_base64");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.ParentContractId).HasColumnName("parent_contract_id");
            entity.Property(e => e.ReturnedAt).HasColumnName("returned_at");
            entity.Property(e => e.CancellationReason).HasColumnName("cancellation_reason");
            entity.Property(e => e.OwnerSignatureExpiry).HasColumnName("owner_signature_expiry");
            entity.Property(e => e.RenterSignatureExpiry).HasColumnName("RenterSignatureExpiry");
            entity.Property(e => e.PaymentExpiry).HasColumnName("PaymentExpiry");
            entity.HasOne(d => d.RentalRequest).WithMany().HasForeignKey(d => d.RentalRequestId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.Renter).WithMany().HasForeignKey(d => d.RenterId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.Warehouse).WithMany().HasForeignKey(d => d.WarehouseId).OnDelete(DeleteBehavior.ClientSetNull);
            // Ignore unmapped navigation collections to prevent EF Core from generating phantom FK columns
            entity.Ignore(e => e.IncludedEquipments);
            entity.Ignore(e => e.EquipmentUsageLogs);
        });

        modelBuilder.Entity<WarehouseReturn>(entity =>
        {
            entity.HasKey(e => e.ReturnId);
            entity.ToTable("warehouse_returns");
            entity.Property(e => e.ReturnId).HasColumnName("return_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.InspectorId).HasColumnName("inspector_id");
            entity.Property(e => e.InspectionDate).HasColumnName("inspection_date");
            entity.Property(e => e.Status).HasMaxLength(30).HasColumnName("status");
            entity.Property(e => e.IsClean).HasColumnName("is_clean");
            entity.Property(e => e.IsEquipmentIntact).HasColumnName("is_equipment_intact");
            entity.Property(e => e.IsNoOutstandingDebt).HasColumnName("is_no_outstanding_debt");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.DamageFee).HasColumnType("decimal(15, 2)").HasColumnName("damage_fee");
            entity.Property(e => e.PenaltyFee).HasColumnType("decimal(15, 2)").HasColumnName("penalty_fee");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(d => d.Contract).WithMany().HasForeignKey(d => d.ContractId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.Inspector).WithMany().HasForeignKey(d => d.InspectorId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<ReturnImage>(entity =>
        {
            entity.HasKey(e => e.ImageId);
            entity.ToTable("return_images");
            entity.Property(e => e.ImageId).HasColumnName("image_id");
            entity.Property(e => e.ReturnId).HasColumnName("return_id");
            entity.Property(e => e.ImageUrl).HasMaxLength(500).HasColumnName("image_url");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.HasOne(d => d.Return).WithMany(p => p.Images).HasForeignKey(d => d.ReturnId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.EquipmentId).HasName("PK__equipmen__197068AFB451FEC1");
            entity.ToTable("equipments", tb => tb.HasTrigger("TR_equipments_updated_at"));
            entity.HasIndex(e => e.IotDeviceId, "UQ__equipments__iot").IsUnique();
            entity.HasIndex(e => e.SerialNumber, "UQ__equipments__serial").IsUnique();
            entity.HasIndex(e => e.Status, "idx_equipments_status");
            entity.HasIndex(e => e.WarehouseId, "idx_equipments_warehouse");
            entity.HasIndex(e => e.RentalAreaId, "idx_equipments_area");
            entity.Property(e => e.EquipmentId).HasColumnName("equipment_id");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.IotDeviceId).HasMaxLength(100).HasColumnName("iot_device_id");
            entity.Property(e => e.LastMaintenanceDate).HasColumnName("last_maintenance_date");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.Type).HasMaxLength(50).HasColumnName("type");
            entity.Property(e => e.SerialNumber).HasMaxLength(100).HasColumnName("serial_number");
            entity.Property(e => e.Location).HasMaxLength(255).HasColumnName("location");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.NextMaintenanceDate).HasColumnName("next_maintenance_date");
            entity.Property(e => e.PurchaseDate).HasColumnName("purchase_date");
            entity.Property(e => e.Specifications).HasColumnName("specifications");
            entity.Property(e => e.MaintenanceCycleDays).HasColumnName("maintenance_cycle_days");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("AVAILABLE").HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.RentalAreaId).HasColumnName("rental_area_id");
            entity.HasOne(d => d.Warehouse).WithMany(p => p.Equipment).HasForeignKey(d => d.WarehouseId).HasConstraintName("FK_equipments_warehouse");
            entity.HasOne(d => d.RentalArea).WithMany(p => p.Equipments).HasForeignKey(d => d.RentalAreaId).HasConstraintName("FK_equipments_rental_area");
            // Ignore unmapped navigation collection to prevent EF Core from generating phantom FK columns
            entity.Ignore(e => e.RentalContracts);
        });

        modelBuilder.Entity<EquipmentHistory>(entity =>
        {
            entity.ToTable("equipment_histories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Equipment).WithMany(p => p.History).HasForeignKey(d => d.EquipmentId);
            // TODO: Fix EquipmentUsageLogs relationship - temporary comment out due to type resolution issues
            // entity.HasOne(d => d.Contract).WithMany(p => p.EquipmentUsageLogs).HasForeignKey(d => d.ContractId);
        });

        modelBuilder.Entity<EquipmentMaintenanceRecord>(entity =>
        {
            entity.ToTable("equipment_maintenance_records");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.TotalCost).HasColumnType("decimal(15, 2)");
            entity.HasOne(d => d.Equipment).WithMany(p => p.MaintenanceRecords).HasForeignKey(d => d.EquipmentId);
        });

        modelBuilder.Entity<EquipmentIncident>(entity =>
        {
            entity.ToTable("equipment_incidents");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.Severity).HasMaxLength(20);
            entity.HasOne(d => d.Equipment).WithMany().HasForeignKey(d => d.EquipmentId);
            entity.HasOne(d => d.Warehouse).WithMany().HasForeignKey(d => d.WarehouseId);
            entity.HasOne(d => d.ReportedBy).WithMany().HasForeignKey(d => d.ReportedById);
        });

        modelBuilder.Entity<EquipmentIncidentComment>(entity =>
        {
            entity.ToTable("equipment_incident_comments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Incident).WithMany(p => p.Comments).HasForeignKey(d => d.IncidentId);
            entity.HasOne(d => d.User).WithMany().HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<EquipmentIncidentAttachment>(entity =>
        {
            entity.ToTable("equipment_incident_attachments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.HasOne(d => d.Incident).WithMany(p => p.Attachments).HasForeignKey(d => d.IncidentId);
        });

        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.HasKey(e => e.ItemId).HasName("PK__inventor__52020FDDDDD8B22E");
            entity.ToTable("inventory_items");
            entity.HasIndex(e => e.InvReqId, "idx_inventory_items_request");
            entity.HasIndex(e => e.AssetId, "idx_inventory_items_asset");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.InvReqId).HasColumnName("inv_req_id");
            entity.Property(e => e.ItemName).HasMaxLength(255).HasColumnName("item_name");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.Unit).HasMaxLength(50).HasColumnName("unit");
            entity.Property(e => e.Weight).HasColumnType("decimal(10, 2)").HasColumnName("weight");
            entity.Property(e => e.AssetId).HasColumnName("asset_id").IsRequired(false);
            // Verify fields (added via patchSql, mapped manually)
            entity.Property(e => e.VerifiedQuantity).HasColumnName("verified_quantity").IsRequired(false);
            entity.Property(e => e.VerifyNote).HasMaxLength(500).HasColumnName("verify_note").IsRequired(false);
            // Volume fields (added via direct ALTER TABLE)
            entity.Property(e => e.EstimatedVolume).HasColumnType("decimal(10, 3)").HasColumnName("EstimatedVolume").IsRequired(false);
            entity.Property(e => e.VerifiedVolume).HasColumnType("decimal(10, 3)").HasColumnName("VerifiedVolume").IsRequired(false);
            entity.Property(e => e.VerifiedWeight).HasColumnType("decimal(10, 3)").HasColumnName("VerifiedWeight").IsRequired(false);
            entity.HasOne(d => d.InvReq).WithMany(p => p.InventoryItems).HasForeignKey(d => d.InvReqId).HasConstraintName("FK_inventory_items_request");
            entity.HasOne(d => d.Asset).WithMany(p => p.InventoryItems).HasForeignKey(d => d.AssetId)
                .IsRequired(false).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_inventory_items_asset");
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
            entity.Property(e => e.RenterSignatureBase64).HasColumnName("renter_signature_base64").IsRequired(false);
            entity.Property(e => e.ManagerSignatureBase64).HasColumnName("manager_signature_base64").IsRequired(false);
            entity.Property(e => e.StaffSignatureBase64).HasColumnName("staff_signature_base64").IsRequired(false);
            entity.Property(e => e.DocumentUrls).HasColumnName("document_urls");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.Type).HasMaxLength(20).HasColumnName("type");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            // Assignment fields
            entity.Property(e => e.AssignedStaffId).HasColumnName("assigned_staff_id").IsRequired(false);
            entity.Property(e => e.AssignedNote).HasColumnName("assigned_note").IsRequired(false);
            entity.Property(e => e.AssignedAt).HasColumnName("assigned_at").IsRequired(false);
            entity.HasOne(d => d.ConfirmedByNavigation).WithMany(p => p.InventoryRequestConfirmedByNavigations).HasForeignKey(d => d.ConfirmedBy).HasConstraintName("FK_inventory_requests_confirmer");
            entity.HasOne(d => d.AssignedStaff).WithMany().HasForeignKey(d => d.AssignedStaffId).HasConstraintName("FK_inventory_requests_assigned_staff");
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

        modelBuilder.Entity<WarehouseGridLocation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_warehouse_grid_locations");
            entity.ToTable("warehouse_grid_locations");
            entity.HasIndex(e => new { e.WarehouseId }, "idx_warehouse_grid_locations_pos");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.Coordinates).HasColumnType("nvarchar(max)").HasColumnName("coordinates");
            entity.Property(e => e.AssetId).HasColumnName("asset_id").IsRequired(false);
            entity.Property(e => e.ItemName).HasMaxLength(255).HasColumnName("item_name").IsRequired(false);
            entity.Property(e => e.RenterId).HasColumnName("renter_id").IsRequired(false);
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.HasOne(d => d.Warehouse).WithMany().HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_warehouse_grid_locations_wh");
            entity.HasOne(d => d.Asset).WithMany().HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_warehouse_grid_locations_asset");
            entity.HasOne(d => d.Renter).WithMany().HasForeignKey(d => d.RenterId)
                .OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_warehouse_grid_locations_renter");
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
                .OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_inv_transactions_request");
            entity.HasOne(d => d.Warehouse).WithMany().HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_inv_transactions_warehouse");
            entity.HasOne(d => d.PerformedByNavigation).WithMany().HasForeignKey(d => d.PerformedBy)
                .OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_inv_transactions_performer");
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

        modelBuilder.Entity<RentalPayment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK_rental_payments");
            entity.ToTable("rental_payments");
            entity.HasIndex(e => e.ContractId, "idx_rental_payments_contract");
            entity.HasIndex(e => e.Status, "idx_rental_payments_status");
            entity.HasIndex(e => e.PaymentCode, "UQ_rental_payments_code").IsUnique();
            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.Amount).HasColumnType("decimal(15, 2)").HasColumnName("amount");
            entity.Property(e => e.PaymentType).HasMaxLength(20).HasColumnName("payment_type");
            entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status");
            entity.Property(e => e.PaymentCode).HasMaxLength(50).HasColumnName("payment_code");
            entity.Property(e => e.PaymentMethod).HasMaxLength(20).HasDefaultValue("BANK_TRANSFER").HasColumnName("payment_method");
            entity.Property(e => e.SepayTransactionId).HasColumnName("sepay_transaction_id");
            entity.Property(e => e.SepayReferenceCode).HasMaxLength(100).HasColumnName("sepay_reference_code");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.ExpiredAt).HasColumnName("expired_at");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            
            // Relationship với Contract (table 'contracts', not 'rental_contracts')
            entity.HasOne(d => d.Contract)
                .WithMany()
                .HasForeignKey(d => d.ContractId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_rental_payments_contracts");
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
            entity.Property(e => e.OwnerReply).HasColumnName("owner_reply");
            entity.Property(e => e.RepliedAt).HasColumnName("replied_at");
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
            entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.ContractImageUrl).HasMaxLength(500).HasColumnName("contract_image_url");
            entity.Property(e => e.CancellationReason).HasColumnName("cancellation_reason");
            entity.Property(e => e.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(e => e.CancelledBy).HasMaxLength(20).HasColumnName("cancelled_by");
            // Custom area columns
            entity.Property(e => e.IsCustomArea).HasColumnName("is_custom_area").HasDefaultValue(false);
            entity.Property(e => e.IsOwnerAssigned).HasColumnName("is_owner_assigned").HasDefaultValue(false);
            entity.Property(e => e.ProposedPositionX).HasColumnName("proposed_position_x").IsRequired(false);
            entity.Property(e => e.ProposedPositionY).HasColumnName("proposed_position_y").IsRequired(false);
            entity.Property(e => e.ProposedWidth).HasColumnName("proposed_width").IsRequired(false);
            entity.Property(e => e.ProposedLength).HasColumnName("proposed_length").IsRequired(false);
            entity.Property(e => e.BaseRentalAreaId).HasColumnName("base_rental_area_id").IsRequired(false);
            // Multi-zone JSON
            entity.Property(e => e.AdditionalZonesJson).HasColumnName("additional_zones_json").IsRequired(false);
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
            entity.Property(e => e.ScheduledAt).HasColumnName("scheduled_at").IsRequired(false);
            entity.Property(e => e.Note).HasColumnName("note").IsRequired(false);
            entity.Property(e => e.RefType).HasMaxLength(20).HasColumnName("ref_type").IsRequired(false);
            entity.Property(e => e.RefId).HasColumnName("ref_id").IsRequired(false);
            entity.HasOne(e => e.Warehouse).WithMany(p => p.Tasks).HasForeignKey(e => e.WarehouseId);
            entity.HasOne(e => e.TaskType).WithMany(t => t.Tasks).HasForeignKey(e => e.TaskTypeId);
        });

        modelBuilder.Entity<UnitTask>(entity =>
        {
            entity.ToTable("unit_tasks");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("unit_task_id");
            entity.Property(e => e.WarehouseTaskId).HasColumnName("warehouse_task_id");
            entity.Property(e => e.UnitTaskTypeCode).HasMaxLength(50).HasColumnName("unit_task_type_code").IsRequired(false);
            entity.Property(e => e.Order).HasColumnName("order").HasDefaultValue(0);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending").HasColumnName("status");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at").IsRequired(false);
            entity.Property(e => e.CompletedBy).HasColumnName("completed_by").IsRequired(false);
            entity.HasOne(e => e.WarehouseTask).WithMany(t => t.UnitTasks).HasForeignKey(e => e.WarehouseTaskId);
            entity.HasOne(e => e.CompletedByUser).WithMany().HasForeignKey(e => e.CompletedBy).IsRequired(false);
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
            entity.Property(e => e.IsAllSkill).HasColumnName("is_all_skill").HasDefaultValue(false);
            entity.Property(e => e.IsAllZone).HasColumnName("is_all_zone").HasDefaultValue(false);
            entity.Property(e => e.WarehouseShiftId).HasColumnName("warehouse_shift_id").IsRequired(false);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("(getdate())");
            entity.HasIndex(e => new { e.UserId, e.WarehouseId, e.WarehouseRoleId })
                  .IsUnique()
                  .HasDatabaseName("IX_warehouse_memberships_user_warehouse_role");
            entity.HasOne(e => e.User).WithMany(u => u.WarehouseMemberships).HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Warehouse).WithMany(w => w.WarehouseMemberships).HasForeignKey(e => e.WarehouseId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Role).WithMany(r => r.Memberships).HasForeignKey(e => e.WarehouseRoleId);
            entity.HasOne(e => e.WarehouseShift).WithMany().HasForeignKey(e => e.WarehouseShiftId).IsRequired(false);
        });



        modelBuilder.Entity<WarehouseRole>(entity =>
        {
            entity.ToTable("warehouse_roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("role_id");
            entity.Property(e => e.Code).HasMaxLength(50).HasColumnName("code");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
        });

        modelBuilder.Entity<Zone>(entity =>
        {
            entity.ToTable("zones");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("zone_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.Code).HasMaxLength(50).HasColumnName("code");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            
            entity.HasOne(e => e.Warehouse)
                  .WithMany(w => w.Zones)
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.ClientSetNull);
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
            entity.Property(e => e.Description).HasColumnName("description").IsRequired(false);
            entity.Property(e => e.IsAllSkill).HasColumnName("is_all_skill").HasDefaultValue(false);
            entity.Property(e => e.IsManual).HasColumnName("is_manual").HasDefaultValue(false);
            entity.Property(e => e.SkillId).HasColumnName("skill_id").IsRequired(false);
            entity.HasOne(e => e.Skill).WithMany().HasForeignKey(e => e.SkillId).IsRequired(false);
        });

        modelBuilder.Entity<WarehouseMembership>()
            .HasMany(m => m.Skills)
            .WithMany(s => s.Memberships)
            .UsingEntity<Dictionary<string, object>>(
                "warehouse_membership_skills",
                j => j.HasOne<Skill>().WithMany().HasForeignKey("skill_id"),
                j => j.HasOne<WarehouseMembership>().WithMany().HasForeignKey("membership_id"),
                j => { j.HasKey("membership_id", "skill_id"); });

        modelBuilder.Entity<WarehouseMembership>()
            .HasMany(m => m.Zones)
            .WithMany(z => z.Memberships)
            .UsingEntity<Dictionary<string, object>>(
                "warehouse_membership_zones",
                j => j.HasOne<Zone>().WithMany().HasForeignKey("zone_id"),
                j => j.HasOne<WarehouseMembership>().WithMany().HasForeignKey("membership_id"),
                j => { j.HasKey("membership_id", "zone_id"); });



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

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.ToTable("subscriptions");
            entity.HasKey(e => e.SubscriptionId);
            entity.Property(e => e.SubscriptionId).HasColumnName("subscription_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Plan).HasMaxLength(50).HasConversion<string>().HasColumnName("plan");
            entity.Property(e => e.Status).HasMaxLength(50).HasConversion<string>().HasColumnName("status");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.TransactionReference).HasMaxLength(100).HasColumnName("transaction_reference");
            
            entity.HasOne(d => d.User)
                  .WithMany(p => p.Subscriptions)
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<SubscriptionPackage>(entity =>
        {
            entity.HasKey(e => e.PackageId);
            entity.ToTable("subscription_packages", tb => tb.HasTrigger("TR_subscription_packages_updated_at"));
            entity.Property(e => e.PackageId).HasColumnName("package_id");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.Price).HasColumnType("decimal(15, 2)").HasColumnName("price");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DurationMonths).HasDefaultValue(1).HasColumnName("duration_months");
            entity.Property(e => e.MaxWarehouses).HasDefaultValue(1).HasColumnName("max_warehouses");
            entity.Property(e => e.MaxStaffPerWarehouse).HasDefaultValue(5).HasColumnName("max_staff_per_warehouse");
            entity.Property(e => e.MaxZonesPerWarehouse).HasDefaultValue(3).HasColumnName("max_zones_per_warehouse");
            entity.Property(e => e.MaxTotalArea).HasColumnType("decimal(18, 2)").HasDefaultValue(500).HasColumnName("max_total_area");
            entity.Property(e => e.AllowEquipmentManagement).HasDefaultValue(false).HasColumnName("allow_equipment_management");
            entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
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
            entity.Property(e => e.ReservedArea).HasColumnName("reserved_area");
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
            entity.Property(e => e.AvailableVolume).HasColumnName("available_volume").IsRequired(false);
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
            entity.Property(e => e.Width).HasColumnName("Width");
            entity.Property(e => e.Length).HasColumnName("Length");
            entity.Property(e => e.MainDoorDirection).HasColumnName("MainDoorDirection");
            entity.Property(e => e.Is24HoursAccess).HasColumnName("is_24_hours_access");
            entity.Property(e => e.OpenTime).HasColumnName("open_time");
            entity.Property(e => e.CloseTime).HasColumnName("close_time");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.Property(e => e.SubmissionType).HasMaxLength(20).HasDefaultValue("NEW").HasColumnName("submission_type");
            entity.Property(e => e.PendingChangeNote).HasMaxLength(500).HasColumnName("pending_change_note");
            entity.HasOne(d => d.ApprovedByNavigation).WithMany(p => p.WarehouseApprovedByNavigations).HasForeignKey(d => d.ApprovedBy).HasConstraintName("FK_warehouses_approver");
            entity.HasOne(d => d.Owner).WithMany(p => p.WarehouseOwners).HasForeignKey(d => d.OwnerId).HasConstraintName("FK_warehouses_owner");
        });

        // ─── AI Analysis Sessions ────────────────────────────────────
        modelBuilder.Entity<AiAnalysisSession>(entity =>
        {
            entity.HasKey(e => e.SessionId);
            entity.ToTable("ai_analysis_sessions");
            entity.Property(e => e.SessionId).HasColumnName("session_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AnalyzedAt).HasDefaultValueSql("(getdate())").HasColumnName("analyzed_at");
            entity.Property(e => e.ImageUrls).HasColumnName("image_urls").IsRequired(false);
            entity.Property(e => e.ResultJson).HasColumnName("result_json").IsRequired(false);
            entity.Property(e => e.EstimatedVolumeM3).HasColumnName("estimated_volume_m3").IsRequired(false);
            entity.Property(e => e.SuggestedType).HasMaxLength(100).HasColumnName("suggested_type").IsRequired(false);
            entity.Property(e => e.SpecialNotes).HasColumnName("special_notes").IsRequired(false);
            entity.Property(e => e.Confidence).HasColumnName("confidence").IsRequired(false);
            entity.HasOne(d => d.User)
                  .WithMany()
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.NoAction)
                  .HasConstraintName("FK_ai_analysis_sessions_users");
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

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PK_notifications");
            entity.ToTable("notifications");
            entity.HasIndex(e => e.UserId, "idx_notifications_user");
            entity.HasIndex(e => e.IsRead, "idx_notifications_is_read");
            entity.HasIndex(e => e.CreatedAt, "idx_notifications_created_at");
            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Title).HasMaxLength(255).HasColumnName("title");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.Type).HasMaxLength(50).HasColumnName("type");
            entity.Property(e => e.ReferenceId).HasColumnName("reference_id");
            entity.Property(e => e.ReferenceType).HasMaxLength(50).HasColumnName("reference_type");
            entity.Property(e => e.IsRead).HasDefaultValue(false).HasColumnName("is_read");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.HasOne(d => d.User).WithMany().HasForeignKey(d => d.UserId).HasConstraintName("FK_notifications_user");
        });

        modelBuilder.Entity<RentalArea>(entity =>
        {
            entity.ToTable("rental_areas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("rental_area_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.Size).HasColumnName("size");
            entity.Property(e => e.Width).HasColumnName("Width");
            entity.Property(e => e.Length).HasColumnName("Length");
            entity.Property(e => e.PositionX).HasColumnName("PositionX");
            entity.Property(e => e.PositionY).HasColumnName("PositionY");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");

            entity.HasOne(e => e.Warehouse)
                  .WithMany(w => w.RentalAreas)
                  .HasForeignKey(e => e.WarehouseId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("FK_rental_areas_warehouse");
        });

        modelBuilder.Entity<ContractVerification>(entity =>
        {
            entity.HasKey(e => e.VerificationId).HasName("PK_contract_verifications");
            entity.ToTable("contract_verifications");
            entity.HasIndex(e => e.ContractId, "idx_cv_contract");
            entity.HasIndex(e => e.UserId, "idx_cv_user");
            entity.Property(e => e.VerificationId).HasColumnName("verification_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.OtpCode).HasMaxLength(6).HasColumnName("otp_code");
            entity.Property(e => e.IsVerified).HasDefaultValue(false).HasColumnName("is_verified");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.VerifiedAt).HasColumnName("verified_at");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
        });

        modelBuilder.Entity<ContractLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK_contract_logs");
            entity.ToTable("contract_logs");
            entity.HasIndex(e => e.ContractId, "idx_cl_contract");
            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Action).HasMaxLength(50).HasColumnName("action");
            entity.Property(e => e.IpAddress).HasMaxLength(50).HasColumnName("ip_address");
            entity.Property(e => e.Details).HasColumnName("details");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
        });

        modelBuilder.Entity<StaffShift>(entity =>
        {
            entity.ToTable("staff_shifts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.MembershipId).HasColumnName("membership_id");
            entity.Property(e => e.ShiftDate).HasColumnName("shift_date");
            entity.Property(e => e.TimeIn1).HasMaxLength(5).HasColumnName("time_in1").IsRequired(false);
            entity.Property(e => e.TimeOut1).HasMaxLength(5).HasColumnName("time_out1").IsRequired(false);
            entity.Property(e => e.TimeIn2).HasMaxLength(5).HasColumnName("time_in2").IsRequired(false);
            entity.Property(e => e.TimeOut2).HasMaxLength(5).HasColumnName("time_out2").IsRequired(false);
            entity.Property(e => e.ShiftType).HasMaxLength(10).HasColumnName("shift_type").IsRequired(false);
            entity.Property(e => e.OvertimeHours).HasColumnType("decimal(4,1)").HasColumnName("overtime_hours").HasDefaultValue(0m);
            entity.Property(e => e.CheckInAt).HasColumnName("check_in_at").IsRequired(false);
            entity.Property(e => e.CheckInPhoto).HasColumnName("check_in_photo").IsRequired(false);
            entity.Property(e => e.CheckOutAt).HasColumnName("check_out_at").IsRequired(false);
            entity.Property(e => e.CheckOutPhoto).HasColumnName("check_out_photo").IsRequired(false);
            entity.HasIndex(e => new { e.MembershipId, e.ShiftDate }).IsUnique().HasDatabaseName("UQ_staff_shifts_membership_date");
            entity.HasOne(e => e.Membership)
                  .WithMany(m => m.StaffShifts)
                  .HasForeignKey(e => e.MembershipId)
                  .OnDelete(DeleteBehavior.Cascade)
                  .HasConstraintName("FK_staff_shifts_membership");
        });

        modelBuilder.Entity<WarehouseShift>(entity =>
        {
            entity.ToTable("warehouse_shifts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.StartTime).HasMaxLength(5).HasColumnName("start_time");
            entity.Property(e => e.EndTime).HasMaxLength(5).HasColumnName("end_time");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id").IsRequired(false);
            entity.HasOne(e => e.Warehouse).WithMany().HasForeignKey(e => e.WarehouseId)
                  .IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RenterAsset>(entity =>
        {
            entity.HasKey(e => e.AssetId).HasName("PK_renter_assets");
            entity.ToTable("renter_assets");
            entity.HasIndex(e => e.RenterId, "idx_ra_renter");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.RenterId).HasColumnName("renter_id");
            entity.Property(e => e.AssetName).HasMaxLength(200).HasColumnName("asset_name");
            entity.Property(e => e.Unit).HasMaxLength(50).HasDefaultValue("cái").HasColumnName("unit");
            entity.Property(e => e.WeightPerUnit).HasColumnType("decimal(10, 2)").HasColumnName("weight_per_unit").IsRequired(false);
            entity.Property(e => e.VolumePerUnit).HasColumnType("decimal(10, 2)").HasColumnName("VolumePerUnit").IsRequired(false);
            entity.Property(e => e.Description).HasColumnName("description").IsRequired(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
            entity.HasOne(d => d.Renter).WithMany().HasForeignKey(d => d.RenterId)
                .OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_ra_renter");
        });

        modelBuilder.Entity<RenterInventory>(entity =>
        {
            entity.HasKey(e => e.InventoryId).HasName("PK_renter_inventory");
            entity.ToTable("renter_inventory");
            entity.HasIndex(e => new { e.AssetId, e.WarehouseId }, "UQ_renter_inventory").IsUnique();
            entity.HasIndex(e => e.AssetId, "idx_ri_asset");
            entity.HasIndex(e => e.WarehouseId, "idx_ri_warehouse");
            entity.Property(e => e.InventoryId).HasColumnName("inventory_id");
            entity.Property(e => e.AssetId).HasColumnName("asset_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnName("updated_at");
            entity.HasOne(d => d.Asset).WithMany(p => p.Inventories).HasForeignKey(d => d.AssetId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_ri_asset");
            entity.HasOne(d => d.Warehouse).WithMany().HasForeignKey(d => d.WarehouseId)
                .OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_ri_warehouse");
        });

        // ── CancellationLog Configuration ──
        modelBuilder.Entity<CancellationLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK_cancellation_logs");
            entity.ToTable("cancellation_logs");
            entity.HasIndex(e => e.RentalRequestId, "IX_cancellation_logs_rental_request_id");
            entity.HasIndex(e => e.RentalContractId, "IX_cancellation_logs_rental_contract_id");
            entity.HasIndex(e => e.CreatedAt, "IX_cancellation_logs_created_at");
            
            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.RentalRequestId).HasColumnName("rental_request_id");
            entity.Property(e => e.RentalContractId).HasColumnName("rental_contract_id");
            entity.Property(e => e.CancelledStage).HasMaxLength(50).HasColumnName("cancelled_stage");
            entity.Property(e => e.CancelledBy).HasMaxLength(50).HasColumnName("cancelled_by");
            entity.Property(e => e.CancellationReason).HasColumnName("cancellation_reason");
            entity.Property(e => e.RefundAmount).HasColumnType("decimal(18, 2)").HasColumnName("refund_amount");
            entity.Property(e => e.CancellationFee).HasColumnType("decimal(18, 2)").HasColumnName("cancellation_fee");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())").HasColumnName("created_at");
            
            entity.HasOne(d => d.RentalRequest)
                .WithMany()
                .HasForeignKey(d => d.RentalRequestId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_cancellation_logs_rental_requests");
                
            entity.HasOne(d => d.RentalContract)
                .WithMany()
                .HasForeignKey(d => d.RentalContractId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_cancellation_logs_rental_contracts");
        });

        // ── Refund Configuration ──
        modelBuilder.Entity<Refund>(entity =>
        {
            entity.HasKey(e => e.RefundId).HasName("PK_refunds");
            entity.ToTable("refunds");
            entity.HasIndex(e => e.PaymentId, "IX_refunds_payment_id");
            entity.HasIndex(e => e.ContractId, "IX_refunds_contract_id");
            entity.HasIndex(e => e.Status, "IX_refunds_status");
            entity.HasIndex(e => e.CreatedAt, "IX_refunds_created_at");
            
            entity.Property(e => e.RefundId).HasColumnName("refund_id");
            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.ContractId).HasColumnName("contract_id");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)").HasColumnName("amount");
            entity.Property(e => e.Reason).HasMaxLength(200).HasColumnName("reason");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING").HasColumnName("status");
            entity.Property(e => e.ProcessedAt).HasColumnName("processed_at");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())").HasColumnName("created_at");
            
            entity.HasOne(d => d.Payment)
                .WithMany()
                .HasForeignKey(d => d.PaymentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_refunds_rental_payments");
                
            entity.HasOne(d => d.Contract)
                .WithMany()
                .HasForeignKey(d => d.ContractId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_refunds_rental_contracts");
        });

        // ── RentalArea: map Id → rental_area_id ────────────────────────────
        modelBuilder.Entity<RentalArea>(entity =>
        {
            entity.Property(e => e.Id).HasColumnName("rental_area_id");
            entity.Property(e => e.WarehouseId).HasColumnName("warehouse_id");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.Size).HasColumnName("size");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnName("created_at");
        });
    }
}
