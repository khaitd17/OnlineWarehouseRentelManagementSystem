IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [contract_logs] (
        [log_id] int NOT NULL IDENTITY,
        [contract_id] int NOT NULL,
        [user_id] int NOT NULL,
        [action] nvarchar(50) NOT NULL,
        [ip_address] nvarchar(50) NULL,
        [details] nvarchar(max) NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_contract_logs] PRIMARY KEY ([log_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [contract_verifications] (
        [verification_id] int NOT NULL IDENTITY,
        [contract_id] int NOT NULL,
        [user_id] int NOT NULL,
        [otp_code] nvarchar(6) NOT NULL,
        [is_verified] bit NOT NULL DEFAULT CAST(0 AS bit),
        [expires_at] datetime2 NOT NULL,
        [verified_at] datetime2 NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_contract_verifications] PRIMARY KEY ([verification_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [roles] (
        [role_id] int NOT NULL IDENTITY,
        [role_name] nvarchar(50) NOT NULL,
        [description] nvarchar(max) NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK__roles__760965CC39FDE095] PRIMARY KEY ([role_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [skills] (
        [skill_id] int NOT NULL IDENTITY,
        [code] nvarchar(50) NOT NULL,
        [name] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_skills] PRIMARY KEY ([skill_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [subscription_packages] (
        [package_id] int NOT NULL IDENTITY,
        [name] nvarchar(100) NOT NULL,
        [price] decimal(15,2) NOT NULL,
        [description] nvarchar(max) NULL,
        [duration_months] int NOT NULL DEFAULT 1,
        [is_active] bit NOT NULL DEFAULT CAST(1 AS bit),
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_subscription_packages] PRIMARY KEY ([package_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_roles] (
        [role_id] int NOT NULL IDENTITY,
        [code] nvarchar(50) NOT NULL,
        [name] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_warehouse_roles] PRIMARY KEY ([role_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [users] (
        [user_id] int NOT NULL IDENTITY,
        [role_id] int NOT NULL,
        [full_name] nvarchar(100) NOT NULL,
        [email] nvarchar(100) NOT NULL,
        [password_hash] nvarchar(255) NOT NULL,
        [phone] nvarchar(20) NULL,
        [avatar_url] nvarchar(max) NULL,
        [status] nvarchar(20) NULL DEFAULT N'PENDING',
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL DEFAULT ((getdate())),
        [last_login_at] datetime2 NULL,
        CONSTRAINT [PK__users__B9BE370FD71B3418] PRIMARY KEY ([user_id]),
        CONSTRAINT [FK_users_roles] FOREIGN KEY ([role_id]) REFERENCES [roles] ([role_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [task_types] (
        [task_type_id] int NOT NULL IDENTITY,
        [code] nvarchar(50) NOT NULL,
        [name] nvarchar(100) NOT NULL,
        [description] nvarchar(max) NULL,
        [is_all_skill] bit NOT NULL DEFAULT CAST(0 AS bit),
        [skill_id] int NULL,
        CONSTRAINT [PK_task_types] PRIMARY KEY ([task_type_id]),
        CONSTRAINT [FK_task_types_skills_skill_id] FOREIGN KEY ([skill_id]) REFERENCES [skills] ([skill_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [notifications] (
        [notification_id] int NOT NULL IDENTITY,
        [user_id] int NOT NULL,
        [title] nvarchar(255) NOT NULL,
        [message] nvarchar(max) NOT NULL,
        [type] nvarchar(50) NOT NULL,
        [reference_id] int NULL,
        [reference_type] nvarchar(50) NULL,
        [is_read] bit NOT NULL DEFAULT CAST(0 AS bit),
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_notifications] PRIMARY KEY ([notification_id]),
        CONSTRAINT [FK_notifications_user] FOREIGN KEY ([user_id]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [password_reset_tokens] (
        [token_id] int NOT NULL IDENTITY,
        [user_id] int NOT NULL,
        [token] nvarchar(256) NOT NULL,
        [expires_at] datetime2 NOT NULL,
        [is_used] bit NOT NULL DEFAULT CAST(0 AS bit),
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK__password_reset_tokens] PRIMARY KEY ([token_id]),
        CONSTRAINT [FK_password_reset_tokens_user] FOREIGN KEY ([user_id]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [renter_assets] (
        [asset_id] int NOT NULL IDENTITY,
        [renter_id] int NOT NULL,
        [asset_name] nvarchar(200) NOT NULL,
        [unit] nvarchar(50) NOT NULL DEFAULT N'cái',
        [weight_per_unit] decimal(10,2) NULL,
        [description] nvarchar(max) NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_renter_assets] PRIMARY KEY ([asset_id]),
        CONSTRAINT [FK_ra_renter] FOREIGN KEY ([renter_id]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [subscriptions] (
        [subscription_id] int NOT NULL IDENTITY,
        [user_id] int NOT NULL,
        [plan] nvarchar(50) NOT NULL,
        [status] nvarchar(50) NOT NULL,
        [start_date] datetime2 NULL,
        [end_date] datetime2 NULL,
        [transaction_reference] nvarchar(100) NULL,
        CONSTRAINT [PK_subscriptions] PRIMARY KEY ([subscription_id]),
        CONSTRAINT [FK_subscriptions_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouses] (
        [warehouse_id] int NOT NULL IDENTITY,
        [owner_id] int NOT NULL,
        [name] nvarchar(255) NOT NULL,
        [address] nvarchar(max) NOT NULL,
        [lat] float NULL,
        [lng] float NULL,
        [description] nvarchar(max) NULL,
        [total_area] float NOT NULL,
        [Width] float NULL,
        [Length] float NULL,
        [MainDoorDirection] nvarchar(max) NULL,
        [available_area] float NOT NULL,
        [PricePerM2] decimal(18,2) NULL,
        [operating_hours] nvarchar(100) NULL,
        [is_24_hours_access] bit NOT NULL,
        [open_time] time NULL,
        [close_time] time NULL,
        [status] nvarchar(20) NULL DEFAULT N'PENDING',
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL DEFAULT ((getdate())),
        [approved_at] datetime2 NULL,
        [approved_by] int NULL,
        [rejection_reason] nvarchar(max) NULL,
        [submission_type] nvarchar(20) NOT NULL DEFAULT N'NEW',
        [pending_change_note] nvarchar(500) NULL,
        CONSTRAINT [PK__warehous__734FE6BFFBD35973] PRIMARY KEY ([warehouse_id]),
        CONSTRAINT [FK_warehouses_approver] FOREIGN KEY ([approved_by]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_warehouses_owner] FOREIGN KEY ([owner_id]) REFERENCES [users] ([user_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [audit_sessions] (
        [audit_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [created_by] int NOT NULL,
        [status] nvarchar(20) NULL DEFAULT N'OPEN',
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [completed_at] datetime2 NULL,
        [notes] nvarchar(max) NULL,
        [assigned_to] int NULL,
        CONSTRAINT [PK__audit_se__5AF33E337F6DAD00] PRIMARY KEY ([audit_id]),
        CONSTRAINT [FK_audit_sessions_assigned_to] FOREIGN KEY ([assigned_to]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_audit_sessions_creator] FOREIGN KEY ([created_by]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_audit_sessions_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [inventory_requests] (
        [inv_req_id] int NOT NULL IDENTITY,
        [renter_id] int NOT NULL,
        [warehouse_id] int NOT NULL,
        [type] nvarchar(20) NOT NULL,
        [status] nvarchar(20) NULL DEFAULT N'PENDING',
        [confirmed_by] int NULL,
        [confirmed_at] datetime2 NULL,
        [assigned_staff_id] int NULL,
        [assigned_note] nvarchar(max) NULL,
        [assigned_at] datetime2 NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL DEFAULT ((getdate())),
        [ScheduledDate] datetime2 NULL,
        [notes] nvarchar(max) NULL,
        [document_urls] nvarchar(max) NULL,
        CONSTRAINT [PK__inventor__A56BE5DEA2C9FF70] PRIMARY KEY ([inv_req_id]),
        CONSTRAINT [FK_inventory_requests_assigned_staff] FOREIGN KEY ([assigned_staff_id]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_inventory_requests_confirmer] FOREIGN KEY ([confirmed_by]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_inventory_requests_renter] FOREIGN KEY ([renter_id]) REFERENCES [users] ([user_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_inventory_requests_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [rental_areas] (
        [rental_area_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [name] nvarchar(100) NOT NULL,
        [size] float NOT NULL,
        [description] nvarchar(max) NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [PositionX] float NULL,
        [PositionY] float NULL,
        [Width] float NULL,
        [Length] float NULL,
        CONSTRAINT [PK_rental_areas] PRIMARY KEY ([rental_area_id]),
        CONSTRAINT [FK_rental_areas_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [renter_inventory] (
        [inventory_id] int NOT NULL IDENTITY,
        [asset_id] int NOT NULL,
        [warehouse_id] int NOT NULL,
        [quantity] int NOT NULL,
        [updated_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_renter_inventory] PRIMARY KEY ([inventory_id]),
        CONSTRAINT [FK_ri_asset] FOREIGN KEY ([asset_id]) REFERENCES [renter_assets] ([asset_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ri_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [tasks] (
        [task_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [task_type_id] int NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [scheduled_at] datetime2 NULL,
        [note] nvarchar(max) NULL,
        [ref_type] nvarchar(20) NULL,
        [ref_id] int NULL,
        CONSTRAINT [PK_tasks] PRIMARY KEY ([task_id]),
        CONSTRAINT [FK_tasks_task_types_task_type_id] FOREIGN KEY ([task_type_id]) REFERENCES [task_types] ([task_type_id]),
        CONSTRAINT [FK_tasks_warehouses_warehouse_id] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_documents] (
        [document_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [document_type] nvarchar(50) NOT NULL,
        [document_url] nvarchar(max) NOT NULL,
        [document_number] nvarchar(100) NULL,
        [issued_date] date NULL,
        [expiry_date] date NULL,
        [status] nvarchar(20) NULL DEFAULT N'PENDING',
        [verified_by] int NULL,
        [verified_at] datetime2 NULL,
        [rejection_reason] nvarchar(max) NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK__warehous__9666E8AC2F6AB1C2] PRIMARY KEY ([document_id]),
        CONSTRAINT [FK_warehouse_documents_verifier] FOREIGN KEY ([verified_by]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_warehouse_documents_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_inventory] (
        [inventory_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [item_name] nvarchar(200) NOT NULL,
        [quantity] int NOT NULL,
        [unit] nvarchar(50) NOT NULL DEFAULT N'cái',
        [updated_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_warehouse_inventory] PRIMARY KEY ([inventory_id]),
        CONSTRAINT [FK_warehouse_inventory_wh] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_media] (
        [media_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [media_url] nvarchar(max) NOT NULL,
        [media_type] nvarchar(20) NOT NULL,
        [display_order] int NULL DEFAULT 0,
        [is_primary] bit NULL DEFAULT CAST(0 AS bit),
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK__warehous__D0A840F42AF1FBBB] PRIMARY KEY ([media_id]),
        CONSTRAINT [FK_warehouse_media_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_shifts] (
        [id] int NOT NULL IDENTITY,
        [name] nvarchar(100) NOT NULL,
        [start_time] nvarchar(5) NOT NULL,
        [end_time] nvarchar(5) NOT NULL,
        [warehouse_id] int NULL,
        CONSTRAINT [PK_warehouse_shifts] PRIMARY KEY ([id]),
        CONSTRAINT [FK_warehouse_shifts_warehouses_warehouse_id] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [zones] (
        [zone_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [code] nvarchar(50) NOT NULL,
        [name] nvarchar(100) NOT NULL,
        [description] nvarchar(max) NULL,
        [is_active] bit NOT NULL DEFAULT CAST(1 AS bit),
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_zones] PRIMARY KEY ([zone_id]),
        CONSTRAINT [FK_zones_warehouses_warehouse_id] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [audit_results] (
        [result_id] int NOT NULL IDENTITY,
        [audit_id] int NOT NULL,
        [item_name] nvarchar(255) NOT NULL,
        [expected_qty] int NOT NULL,
        [actual_qty] int NOT NULL,
        [discrepancy] AS ([actual_qty]-[expected_qty]) PERSISTED,
        [discrepancy_reason] nvarchar(max) NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [recorded_by] int NULL,
        CONSTRAINT [PK__audit_re__AFB3C316E98B7AC0] PRIMARY KEY ([result_id]),
        CONSTRAINT [FK_audit_results_audit] FOREIGN KEY ([audit_id]) REFERENCES [audit_sessions] ([audit_id]),
        CONSTRAINT [FK_audit_results_recorded_by] FOREIGN KEY ([recorded_by]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [inventory_items] (
        [item_id] int NOT NULL IDENTITY,
        [inv_req_id] int NOT NULL,
        [item_name] nvarchar(255) NOT NULL,
        [quantity] int NOT NULL,
        [unit] nvarchar(50) NOT NULL,
        [weight] decimal(10,2) NULL,
        [description] nvarchar(max) NULL,
        [asset_id] int NULL,
        CONSTRAINT [PK__inventor__52020FDDDDD8B22E] PRIMARY KEY ([item_id]),
        CONSTRAINT [FK_inventory_items_asset] FOREIGN KEY ([asset_id]) REFERENCES [renter_assets] ([asset_id]),
        CONSTRAINT [FK_inventory_items_request] FOREIGN KEY ([inv_req_id]) REFERENCES [inventory_requests] ([inv_req_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [inventory_transactions] (
        [transaction_id] int NOT NULL IDENTITY,
        [inv_req_id] int NOT NULL,
        [type] nvarchar(20) NOT NULL,
        [warehouse_id] int NOT NULL,
        [item_name] nvarchar(200) NOT NULL,
        [quantity] int NOT NULL,
        [unit] nvarchar(50) NOT NULL DEFAULT N'cái',
        [performed_by] int NOT NULL,
        [notes] nvarchar(max) NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_inventory_transactions] PRIMARY KEY ([transaction_id]),
        CONSTRAINT [FK_inv_transactions_performer] FOREIGN KEY ([performed_by]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_inv_transactions_request] FOREIGN KEY ([inv_req_id]) REFERENCES [inventory_requests] ([inv_req_id]),
        CONSTRAINT [FK_inv_transactions_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [equipments] (
        [equipment_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [rental_area_id] int NULL,
        [name] nvarchar(100) NOT NULL,
        [type] nvarchar(50) NULL,
        [serial_number] nvarchar(100) NULL,
        [location] nvarchar(255) NULL,
        [description] nvarchar(max) NULL,
        [specifications] nvarchar(max) NULL,
        [status] nvarchar(20) NULL DEFAULT N'AVAILABLE',
        [note] nvarchar(max) NULL,
        [iot_device_id] nvarchar(100) NULL,
        [maintenance_cycle_days] int NULL,
        [purchase_date] date NULL,
        [last_maintenance_date] date NULL,
        [next_maintenance_date] date NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK__equipmen__197068AFB451FEC1] PRIMARY KEY ([equipment_id]),
        CONSTRAINT [FK_equipments_rental_area] FOREIGN KEY ([rental_area_id]) REFERENCES [rental_areas] ([rental_area_id]),
        CONSTRAINT [FK_equipments_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [rental_requests] (
        [request_id] int NOT NULL IDENTITY,
        [renter_id] int NOT NULL,
        [warehouse_id] int NOT NULL,
        [RentalAreaId] int NULL,
        [requested_area] float NOT NULL,
        [start_date] datetime2 NOT NULL,
        [duration_months] int NOT NULL,
        [status] nvarchar(20) NOT NULL DEFAULT N'PENDING',
        [notes] nvarchar(max) NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL DEFAULT ((getdate())),
        [reviewed_by] int NULL,
        [reviewed_at] datetime2 NULL,
        [rejection_reason] nvarchar(max) NULL,
        [contract_image_url] nvarchar(500) NULL,
        [CancellationReason] nvarchar(max) NULL,
        [CancelledAt] datetime2 NULL,
        [CancelledBy] nvarchar(max) NULL,
        CONSTRAINT [PK__rental_r__18D3B90F92B6C93A] PRIMARY KEY ([request_id]),
        CONSTRAINT [FK_rental_requests_rental_areas_RentalAreaId] FOREIGN KEY ([RentalAreaId]) REFERENCES [rental_areas] ([rental_area_id]),
        CONSTRAINT [FK_rental_requests_renter] FOREIGN KEY ([renter_id]) REFERENCES [users] ([user_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_rental_requests_reviewer] FOREIGN KEY ([reviewed_by]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_rental_requests_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [unit_tasks] (
        [unit_task_id] int NOT NULL IDENTITY,
        [warehouse_task_id] int NOT NULL,
        [unit_task_type_code] nvarchar(50) NULL,
        [order] int NOT NULL DEFAULT 0,
        [description] nvarchar(max) NOT NULL,
        [status] nvarchar(20) NOT NULL DEFAULT N'Pending',
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [completed_at] datetime2 NULL,
        [completed_by] int NULL,
        CONSTRAINT [PK_unit_tasks] PRIMARY KEY ([unit_task_id]),
        CONSTRAINT [FK_unit_tasks_tasks_warehouse_task_id] FOREIGN KEY ([warehouse_task_id]) REFERENCES [tasks] ([task_id]),
        CONSTRAINT [FK_unit_tasks_users_completed_by] FOREIGN KEY ([completed_by]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_memberships] (
        [membership_id] int NOT NULL IDENTITY,
        [user_id] int NOT NULL,
        [warehouse_id] int NOT NULL,
        [warehouse_role_id] int NOT NULL,
        [is_active] bit NOT NULL,
        [is_all_skill] bit NOT NULL DEFAULT CAST(0 AS bit),
        [is_all_zone] bit NOT NULL DEFAULT CAST(0 AS bit),
        [warehouse_shift_id] int NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_warehouse_memberships] PRIMARY KEY ([membership_id]),
        CONSTRAINT [FK_warehouse_memberships_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_warehouse_memberships_warehouse_roles_warehouse_role_id] FOREIGN KEY ([warehouse_role_id]) REFERENCES [warehouse_roles] ([role_id]),
        CONSTRAINT [FK_warehouse_memberships_warehouse_shifts_warehouse_shift_id] FOREIGN KEY ([warehouse_shift_id]) REFERENCES [warehouse_shifts] ([id]),
        CONSTRAINT [FK_warehouse_memberships_warehouses_warehouse_id] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [equipment_incidents] (
        [Id] int NOT NULL IDENTITY,
        [EquipmentId] int NOT NULL,
        [WarehouseId] int NOT NULL,
        [ReportedById] int NOT NULL,
        [Title] nvarchar(255) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Severity] nvarchar(20) NOT NULL,
        [Status] nvarchar(20) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
        [UpdatedAt] datetime2 NULL,
        [ResolvedAt] datetime2 NULL,
        CONSTRAINT [PK_equipment_incidents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_equipment_incidents_equipments_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [equipments] ([equipment_id]),
        CONSTRAINT [FK_equipment_incidents_users_ReportedById] FOREIGN KEY ([ReportedById]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_equipment_incidents_warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [equipment_maintenance_records] (
        [Id] int NOT NULL IDENTITY,
        [EquipmentId] int NOT NULL,
        [MaintenanceDate] datetime2 NULL,
        [MaintenanceType] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [TotalCost] decimal(15,2) NULL,
        [PerformedBy] nvarchar(max) NULL,
        [ResolutionStatus] nvarchar(max) NULL,
        [Note] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_equipment_maintenance_records] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_equipment_maintenance_records_equipments_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [equipments] ([equipment_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [contracts] (
        [contract_id] int NOT NULL IDENTITY,
        [request_id] int NOT NULL,
        [renter_id] int NOT NULL,
        [warehouse_id] int NOT NULL,
        [contract_url] nvarchar(max) NULL,
        [signed_file_url] nvarchar(500) NULL,
        [signed_at] datetime2 NULL,
        [terms] nvarchar(max) NULL,
        [contract_number] nvarchar(100) NULL,
        [start_date] date NOT NULL,
        [end_date] date NOT NULL,
        [status] nvarchar(30) NULL DEFAULT N'PENDING_OWNER_SIGNATURE',
        [total_value] decimal(15,2) NOT NULL,
        [deposit_amount] decimal(15,2) NULL,
        [monthly_payment] decimal(15,2) NOT NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL DEFAULT ((getdate())),
        [owner_signed_file_url] nvarchar(500) NULL,
        [owner_signed_at] datetime2 NULL,
        [owner_signature_base64] nvarchar(max) NULL,
        [TerminatedAt] datetime2 NULL,
        [TerminationReason] nvarchar(max) NULL,
        [termination_requested_by] nvarchar(20) NULL,
        [termination_requested_at] datetime2 NULL,
        [renter_approved_termination] bit NOT NULL DEFAULT CAST(0 AS bit),
        [owner_approved_termination] bit NOT NULL DEFAULT CAST(0 AS bit),
        [early_termination_fee] decimal(15,2) NULL,
        CONSTRAINT [PK__contract__F8D664239D04D92E] PRIMARY KEY ([contract_id]),
        CONSTRAINT [FK_contracts_renter] FOREIGN KEY ([renter_id]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_contracts_request] FOREIGN KEY ([request_id]) REFERENCES [rental_requests] ([request_id]),
        CONSTRAINT [FK_contracts_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [rental_contracts] (
        [contract_id] int NOT NULL IDENTITY,
        [rental_request_id] int NOT NULL,
        [contract_number] nvarchar(100) NOT NULL,
        [renter_id] int NOT NULL,
        [warehouse_id] int NOT NULL,
        [start_date] datetime2 NOT NULL,
        [end_date] datetime2 NOT NULL,
        [monthly_payment] decimal(15,2) NOT NULL,
        [total_value] decimal(15,2) NOT NULL,
        [deposit_amount] decimal(15,2) NULL,
        [status] nvarchar(50) NOT NULL,
        [terms] nvarchar(max) NULL,
        [contract_file_url] nvarchar(500) NULL,
        [signed_file_url] nvarchar(500) NULL,
        [signed_at] datetime2 NULL,
        [owner_signed_file_url] nvarchar(500) NULL,
        [owner_signed_at] datetime2 NULL,
        [owner_signature_base64] nvarchar(max) NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL,
        [parent_contract_id] int NULL,
        [returned_at] datetime2 NULL,
        [cancellation_reason] nvarchar(max) NULL,
        [TerminatedAt] datetime2 NULL,
        [TerminationReason] nvarchar(max) NULL,
        [CancelledAt] datetime2 NULL,
        [CancelledBy] nvarchar(max) NULL,
        [GracePeriodHours] int NOT NULL,
        [cancellation_fee] decimal(15,2) NULL,
        [owner_signature_expiry] datetime2 NULL,
        [RenterSignatureExpiry] datetime2 NULL,
        [PaymentExpiry] datetime2 NULL,
        [TerminationRequestedBy] nvarchar(max) NULL,
        [TerminationRequestedAt] datetime2 NULL,
        [RenterApprovedTermination] bit NOT NULL,
        [OwnerApprovedTermination] bit NOT NULL,
        [early_termination_fee] decimal(15,2) NULL,
        CONSTRAINT [PK_rental_contracts] PRIMARY KEY ([contract_id]),
        CONSTRAINT [FK_rental_contracts_rental_requests_rental_request_id] FOREIGN KEY ([rental_request_id]) REFERENCES [rental_requests] ([request_id]),
        CONSTRAINT [FK_rental_contracts_users_renter_id] FOREIGN KEY ([renter_id]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_rental_contracts_warehouses_warehouse_id] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [staff_shifts] (
        [id] int NOT NULL IDENTITY,
        [membership_id] int NOT NULL,
        [shift_date] date NOT NULL,
        [time_in1] nvarchar(5) NULL,
        [time_out1] nvarchar(5) NULL,
        [time_in2] nvarchar(5) NULL,
        [time_out2] nvarchar(5) NULL,
        [shift_type] nvarchar(10) NULL,
        CONSTRAINT [PK_staff_shifts] PRIMARY KEY ([id]),
        CONSTRAINT [FK_staff_shifts_membership] FOREIGN KEY ([membership_id]) REFERENCES [warehouse_memberships] ([membership_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_membership_skills] (
        [membership_id] int NOT NULL,
        [skill_id] int NOT NULL,
        CONSTRAINT [PK_warehouse_membership_skills] PRIMARY KEY ([membership_id], [skill_id]),
        CONSTRAINT [FK_warehouse_membership_skills_skills_skill_id] FOREIGN KEY ([skill_id]) REFERENCES [skills] ([skill_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_warehouse_membership_skills_warehouse_memberships_membership_id] FOREIGN KEY ([membership_id]) REFERENCES [warehouse_memberships] ([membership_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_membership_zones] (
        [membership_id] int NOT NULL,
        [zone_id] int NOT NULL,
        CONSTRAINT [PK_warehouse_membership_zones] PRIMARY KEY ([membership_id], [zone_id]),
        CONSTRAINT [FK_warehouse_membership_zones_warehouse_memberships_membership_id] FOREIGN KEY ([membership_id]) REFERENCES [warehouse_memberships] ([membership_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_warehouse_membership_zones_zones_zone_id] FOREIGN KEY ([zone_id]) REFERENCES [zones] ([zone_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [equipment_incident_attachments] (
        [Id] int NOT NULL IDENTITY,
        [IncidentId] int NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        [FileType] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_equipment_incident_attachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_equipment_incident_attachments_equipment_incidents_IncidentId] FOREIGN KEY ([IncidentId]) REFERENCES [equipment_incidents] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [equipment_incident_comments] (
        [Id] int NOT NULL IDENTITY,
        [IncidentId] int NOT NULL,
        [UserId] int NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_equipment_incident_comments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_equipment_incident_comments_equipment_incidents_IncidentId] FOREIGN KEY ([IncidentId]) REFERENCES [equipment_incidents] ([Id]),
        CONSTRAINT [FK_equipment_incident_comments_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [contract_extensions] (
        [extension_id] int NOT NULL IDENTITY,
        [original_contract_id] int NOT NULL,
        [new_contract_id] int NULL,
        [requester_id] int NOT NULL,
        [duration_months] int NOT NULL,
        [proposed_monthly_payment] decimal(15,2) NULL,
        [status] nvarchar(30) NOT NULL,
        [notes] nvarchar(max) NULL,
        [rejection_reason] nvarchar(max) NULL,
        [requested_at] datetime2 NOT NULL,
        [reviewed_at] datetime2 NULL,
        [reviewed_by] int NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_contract_extensions] PRIMARY KEY ([extension_id]),
        CONSTRAINT [FK_contract_extensions_contracts_new_contract_id] FOREIGN KEY ([new_contract_id]) REFERENCES [contracts] ([contract_id]),
        CONSTRAINT [FK_contract_extensions_contracts_original_contract_id] FOREIGN KEY ([original_contract_id]) REFERENCES [contracts] ([contract_id]),
        CONSTRAINT [FK_contract_extensions_users_requester_id] FOREIGN KEY ([requester_id]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_contract_extensions_users_reviewed_by] FOREIGN KEY ([reviewed_by]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [equipment_histories] (
        [Id] int NOT NULL IDENTITY,
        [EquipmentId] int NOT NULL,
        [PreviousStatus] nvarchar(max) NULL,
        [NewStatus] nvarchar(max) NULL,
        [PreviousRentalAreaId] int NULL,
        [NewRentalAreaId] int NULL,
        [ContractId] int NULL,
        [ChangedBy] int NULL,
        [Note] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_equipment_histories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_equipment_histories_contracts_ContractId] FOREIGN KEY ([ContractId]) REFERENCES [contracts] ([contract_id]),
        CONSTRAINT [FK_equipment_histories_equipments_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [equipments] ([equipment_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [payments] (
        [payment_id] int NOT NULL IDENTITY,
        [contract_id] int NOT NULL,
        [amount] decimal(15,2) NOT NULL,
        [payment_period] nvarchar(7) NULL,
        [payment_date] datetime2 NULL DEFAULT ((getdate())),
        [due_date] date NULL,
        [payment_method] nvarchar(20) NULL DEFAULT N'TRANSFER',
        [status] nvarchar(20) NULL DEFAULT N'PENDING',
        [transaction_reference] nvarchar(100) NULL,
        [notes] nvarchar(max) NULL,
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        CONSTRAINT [PK__payments__ED1FC9EA910B49F8] PRIMARY KEY ([payment_id]),
        CONSTRAINT [FK_payments_contract] FOREIGN KEY ([contract_id]) REFERENCES [contracts] ([contract_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [ratings] (
        [rating_id] int NOT NULL IDENTITY,
        [warehouse_id] int NOT NULL,
        [renter_id] int NOT NULL,
        [contract_id] int NULL,
        [star] int NOT NULL,
        [comment] nvarchar(max) NULL,
        [is_hidden] bit NULL DEFAULT CAST(0 AS bit),
        [created_at] datetime2 NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL DEFAULT ((getdate())),
        [owner_reply] nvarchar(max) NULL,
        [replied_at] datetime2 NULL,
        CONSTRAINT [PK__ratings__D35B278BC49635DF] PRIMARY KEY ([rating_id]),
        CONSTRAINT [FK_ratings_contract] FOREIGN KEY ([contract_id]) REFERENCES [contracts] ([contract_id]),
        CONSTRAINT [FK_ratings_renter] FOREIGN KEY ([renter_id]) REFERENCES [users] ([user_id]),
        CONSTRAINT [FK_ratings_warehouse] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [rental_payments] (
        [payment_id] int NOT NULL IDENTITY,
        [contract_id] int NOT NULL,
        [amount] decimal(15,2) NOT NULL,
        [payment_type] nvarchar(20) NOT NULL,
        [status] nvarchar(20) NOT NULL,
        [payment_code] nvarchar(50) NOT NULL,
        [payment_method] nvarchar(20) NOT NULL DEFAULT N'BANK_TRANSFER',
        [sepay_transaction_id] int NULL,
        [sepay_reference_code] nvarchar(100) NULL,
        [paid_at] datetime2 NULL,
        [expired_at] datetime2 NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL,
        [RetryCount] int NOT NULL,
        [MaxRetry] int NOT NULL,
        [LastRetryAt] datetime2 NULL,
        CONSTRAINT [PK_rental_payments] PRIMARY KEY ([payment_id]),
        CONSTRAINT [FK_rental_payments_contracts] FOREIGN KEY ([contract_id]) REFERENCES [contracts] ([contract_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [cancellation_logs] (
        [log_id] int NOT NULL IDENTITY,
        [rental_request_id] int NULL,
        [rental_contract_id] int NULL,
        [cancelled_stage] nvarchar(50) NOT NULL,
        [cancelled_by] nvarchar(50) NOT NULL,
        [cancellation_reason] nvarchar(max) NOT NULL,
        [refund_amount] decimal(18,2) NULL,
        [cancellation_fee] decimal(18,2) NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getutcdate())),
        CONSTRAINT [PK_cancellation_logs] PRIMARY KEY ([log_id]),
        CONSTRAINT [FK_cancellation_logs_rental_contracts] FOREIGN KEY ([rental_contract_id]) REFERENCES [rental_contracts] ([contract_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_cancellation_logs_rental_requests] FOREIGN KEY ([rental_request_id]) REFERENCES [rental_requests] ([request_id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [warehouse_returns] (
        [return_id] int NOT NULL IDENTITY,
        [contract_id] int NOT NULL,
        [inspector_id] int NULL,
        [inspection_date] datetime2 NULL,
        [status] nvarchar(30) NOT NULL,
        [is_clean] bit NOT NULL,
        [is_equipment_intact] bit NOT NULL,
        [is_no_outstanding_debt] bit NOT NULL,
        [notes] nvarchar(max) NULL,
        [rejection_reason] nvarchar(max) NULL,
        [damage_fee] decimal(15,2) NULL,
        [penalty_fee] decimal(15,2) NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_warehouse_returns] PRIMARY KEY ([return_id]),
        CONSTRAINT [FK_warehouse_returns_rental_contracts_contract_id] FOREIGN KEY ([contract_id]) REFERENCES [rental_contracts] ([contract_id]),
        CONSTRAINT [FK_warehouse_returns_users_inspector_id] FOREIGN KEY ([inspector_id]) REFERENCES [users] ([user_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [refunds] (
        [refund_id] int NOT NULL IDENTITY,
        [payment_id] int NULL,
        [contract_id] int NOT NULL,
        [amount] decimal(18,2) NOT NULL,
        [reason] nvarchar(200) NOT NULL,
        [status] nvarchar(20) NOT NULL DEFAULT N'PENDING',
        [processed_at] datetime2 NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getutcdate())),
        CONSTRAINT [PK_refunds] PRIMARY KEY ([refund_id]),
        CONSTRAINT [FK_refunds_rental_contracts] FOREIGN KEY ([contract_id]) REFERENCES [rental_contracts] ([contract_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_refunds_rental_payments] FOREIGN KEY ([payment_id]) REFERENCES [rental_payments] ([payment_id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE TABLE [return_images] (
        [image_id] int NOT NULL IDENTITY,
        [return_id] int NOT NULL,
        [image_url] nvarchar(500) NOT NULL,
        [description] nvarchar(max) NULL,
        [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
        CONSTRAINT [PK_return_images] PRIMARY KEY ([image_id]),
        CONSTRAINT [FK_return_images_warehouse_returns_return_id] FOREIGN KEY ([return_id]) REFERENCES [warehouse_returns] ([return_id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_audit_results_audit] ON [audit_results] ([audit_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_audit_results_recorded_by] ON [audit_results] ([recorded_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_audit_sessions_created_at] ON [audit_sessions] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_audit_sessions_status] ON [audit_sessions] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_audit_sessions_warehouse] ON [audit_sessions] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_audit_sessions_assigned_to] ON [audit_sessions] ([assigned_to]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_audit_sessions_created_by] ON [audit_sessions] ([created_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_cancellation_logs_created_at] ON [cancellation_logs] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_cancellation_logs_rental_contract_id] ON [cancellation_logs] ([rental_contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_cancellation_logs_rental_request_id] ON [cancellation_logs] ([rental_request_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_contract_extensions_new_contract_id] ON [contract_extensions] ([new_contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_contract_extensions_original_contract_id] ON [contract_extensions] ([original_contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_contract_extensions_requester_id] ON [contract_extensions] ([requester_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_contract_extensions_reviewed_by] ON [contract_extensions] ([reviewed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_cl_contract] ON [contract_logs] ([contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_cv_contract] ON [contract_verifications] ([contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_cv_user] ON [contract_verifications] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_contracts_dates] ON [contracts] ([start_date], [end_date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_contracts_renter] ON [contracts] ([renter_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_contracts_request] ON [contracts] ([request_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_contracts_status] ON [contracts] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_contracts_warehouse] ON [contracts] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UQ__contract__1CA37CCE4DCEA66E] ON [contracts] ([contract_number]) WHERE [contract_number] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_histories_ContractId] ON [equipment_histories] ([ContractId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_histories_EquipmentId] ON [equipment_histories] ([EquipmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_incident_attachments_IncidentId] ON [equipment_incident_attachments] ([IncidentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_incident_comments_IncidentId] ON [equipment_incident_comments] ([IncidentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_incident_comments_UserId] ON [equipment_incident_comments] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_incidents_EquipmentId] ON [equipment_incidents] ([EquipmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_incidents_ReportedById] ON [equipment_incidents] ([ReportedById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_incidents_WarehouseId] ON [equipment_incidents] ([WarehouseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_equipment_maintenance_records_EquipmentId] ON [equipment_maintenance_records] ([EquipmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_equipments_area] ON [equipments] ([rental_area_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_equipments_iot] ON [equipments] ([iot_device_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_equipments_status] ON [equipments] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_equipments_warehouse] ON [equipments] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inventory_items_asset] ON [inventory_items] ([asset_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inventory_items_request] ON [inventory_items] ([inv_req_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inventory_requests_created_at] ON [inventory_requests] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inventory_requests_renter] ON [inventory_requests] ([renter_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inventory_requests_status] ON [inventory_requests] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inventory_requests_type] ON [inventory_requests] ([type]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inventory_requests_warehouse] ON [inventory_requests] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_inventory_requests_assigned_staff_id] ON [inventory_requests] ([assigned_staff_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_inventory_requests_confirmed_by] ON [inventory_requests] ([confirmed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inv_transactions_created] ON [inventory_transactions] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inv_transactions_type] ON [inventory_transactions] ([type]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_inv_transactions_warehouse] ON [inventory_transactions] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_inventory_transactions_inv_req_id] ON [inventory_transactions] ([inv_req_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_inventory_transactions_performed_by] ON [inventory_transactions] ([performed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_notifications_created_at] ON [notifications] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_notifications_is_read] ON [notifications] ([is_read]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_notifications_user] ON [notifications] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [idx_prt_token] ON [password_reset_tokens] ([token]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_prt_user_id] ON [password_reset_tokens] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_payments_contract] ON [payments] ([contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_payments_due_date] ON [payments] ([due_date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_payments_period] ON [payments] ([payment_period]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_payments_status] ON [payments] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_ratings_created_at] ON [ratings] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_ratings_renter] ON [ratings] ([renter_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_ratings_star] ON [ratings] ([star]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_ratings_warehouse] ON [ratings] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ratings_contract_id] ON [ratings] ([contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_refunds_contract_id] ON [refunds] ([contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_refunds_created_at] ON [refunds] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_refunds_payment_id] ON [refunds] ([payment_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_refunds_status] ON [refunds] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_rental_areas_warehouse_id] ON [rental_areas] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_rental_contracts_rental_request_id] ON [rental_contracts] ([rental_request_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_rental_contracts_renter_id] ON [rental_contracts] ([renter_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_rental_contracts_warehouse_id] ON [rental_contracts] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_rental_payments_contract] ON [rental_payments] ([contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_rental_payments_status] ON [rental_payments] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_rental_payments_code] ON [rental_payments] ([payment_code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_rental_requests_created_at] ON [rental_requests] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_rental_requests_renter] ON [rental_requests] ([renter_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_rental_requests_status] ON [rental_requests] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_rental_requests_warehouse] ON [rental_requests] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_rental_requests_RentalAreaId] ON [rental_requests] ([RentalAreaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_rental_requests_reviewed_by] ON [rental_requests] ([reviewed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_ra_renter] ON [renter_assets] ([renter_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_ri_asset] ON [renter_inventory] ([asset_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_ri_warehouse] ON [renter_inventory] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_renter_inventory] ON [renter_inventory] ([asset_id], [warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_return_images_return_id] ON [return_images] ([return_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_role_name] ON [roles] ([role_name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [UQ__roles__783254B1C0716E85] ON [roles] ([role_name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_staff_shifts_membership_date] ON [staff_shifts] ([membership_id], [shift_date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_subscriptions_user_id] ON [subscriptions] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_task_types_skill_id] ON [task_types] ([skill_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tasks_task_type_id] ON [tasks] ([task_type_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tasks_warehouse_id] ON [tasks] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_unit_tasks_completed_by] ON [unit_tasks] ([completed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_unit_tasks_warehouse_task_id] ON [unit_tasks] ([warehouse_task_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_users_created_at] ON [users] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_users_email] ON [users] ([email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_users_role] ON [users] ([role_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_users_status] ON [users] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [UQ__users__AB6E616480871272] ON [users] ([email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_documents_verified_by] ON [warehouse_documents] ([verified_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_documents_warehouse_id] ON [warehouse_documents] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_warehouse_inventory_item] ON [warehouse_inventory] ([warehouse_id], [item_name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_warehouse_media_order] ON [warehouse_media] ([warehouse_id], [display_order]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_warehouse_media_warehouse] ON [warehouse_media] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_membership_skills_skill_id] ON [warehouse_membership_skills] ([skill_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_membership_zones_zone_id] ON [warehouse_membership_zones] ([zone_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_warehouse_memberships_user_id_warehouse_id] ON [warehouse_memberships] ([user_id], [warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_memberships_warehouse_id] ON [warehouse_memberships] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_memberships_warehouse_role_id] ON [warehouse_memberships] ([warehouse_role_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_memberships_warehouse_shift_id] ON [warehouse_memberships] ([warehouse_shift_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_returns_contract_id] ON [warehouse_returns] ([contract_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_returns_inspector_id] ON [warehouse_returns] ([inspector_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouse_shifts_warehouse_id] ON [warehouse_shifts] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_warehouses_created_at] ON [warehouses] ([created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_warehouses_location] ON [warehouses] ([lat], [lng]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_warehouses_owner] ON [warehouses] ([owner_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [idx_warehouses_status] ON [warehouses] ([status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_warehouses_approved_by] ON [warehouses] ([approved_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_zones_warehouse_id] ON [zones] ([warehouse_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260414145642_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260414145642_InitialCreate', N'9.0.0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415103318_AddWarehouseType'
)
BEGIN
    EXEC sp_rename N'[rental_contracts].[early_termination_fee]', N'EarlyTerminationFee', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415103318_AddWarehouseType'
)
BEGIN
    EXEC sp_rename N'[rental_contracts].[cancellation_fee]', N'CancellationFee', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415103318_AddWarehouseType'
)
BEGIN
    ALTER TABLE [warehouses] ADD [WarehouseType] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415103318_AddWarehouseType'
)
BEGIN
    ALTER TABLE [task_types] ADD [is_manual] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415103318_AddWarehouseType'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[rental_contracts]') AND [c].[name] = N'EarlyTerminationFee');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [rental_contracts] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [rental_contracts] ALTER COLUMN [EarlyTerminationFee] decimal(18,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415103318_AddWarehouseType'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[rental_contracts]') AND [c].[name] = N'CancellationFee');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [rental_contracts] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [rental_contracts] ALTER COLUMN [CancellationFee] decimal(18,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260415103318_AddWarehouseType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260415103318_AddWarehouseType', N'9.0.0');
END;

COMMIT;
GO

