BEGIN TRANSACTION;
ALTER TABLE [warehouses] ADD [Height] float NULL;

ALTER TABLE [rental_requests] ADD [additional_zones_json] nvarchar(max) NULL;

ALTER TABLE [rental_requests] ADD [is_owner_assigned] bit NOT NULL DEFAULT CAST(0 AS bit);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260507072633_AddWarehouseHeight', N'9.0.0');

CREATE TABLE [owner_contract_templates] (
    [template_id] int NOT NULL IDENTITY,
    [owner_id] int NOT NULL,
    [template_name] nvarchar(150) NOT NULL,
    [use_basic_info_section] bit NOT NULL DEFAULT CAST(1 AS bit),
    [use_payment_section] bit NOT NULL DEFAULT CAST(1 AS bit),
    [use_violation_section] bit NOT NULL DEFAULT CAST(1 AS bit),
    [use_termination_section] bit NOT NULL DEFAULT CAST(1 AS bit),
    [use_signature_section] bit NOT NULL DEFAULT CAST(1 AS bit),
    [basic_info_content] nvarchar(max) NULL,
    [payment_content] nvarchar(max) NULL,
    [violation_content] nvarchar(max) NULL,
    [termination_content] nvarchar(max) NULL,
    [signature_content] nvarchar(max) NULL,
    [is_default] bit NOT NULL DEFAULT CAST(0 AS bit),
    [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
    [updated_at] datetime2 NULL,
    CONSTRAINT [PK_owner_contract_templates] PRIMARY KEY ([template_id]),
    CONSTRAINT [FK_owner_contract_templates_owner] FOREIGN KEY ([owner_id]) REFERENCES [users] ([user_id])
);

CREATE INDEX [idx_owner_contract_templates_default] ON [owner_contract_templates] ([owner_id], [is_default]);

CREATE INDEX [idx_owner_contract_templates_owner] ON [owner_contract_templates] ([owner_id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260509071408_AddOwnerContractTemplates', N'9.0.0');

ALTER TABLE [owner_contract_templates] ADD [additional_terms_content] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260509074259_AddOwnerContractTemplateAdditionalTerms', N'9.0.0');

CREATE TABLE [warehouse_grid_locations] (
    [id] int NOT NULL IDENTITY,
    [warehouse_id] int NOT NULL,
    [grid_x] decimal(10,2) NOT NULL,
    [grid_y] decimal(10,2) NOT NULL,
    [asset_id] int NULL,
    [item_name] nvarchar(255) NULL,
    [renter_id] int NULL,
    [quantity] int NOT NULL,
    [updated_at] datetime2 NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK_warehouse_grid_locations] PRIMARY KEY ([id]),
    CONSTRAINT [FK_warehouse_grid_locations_asset] FOREIGN KEY ([asset_id]) REFERENCES [renter_assets] ([asset_id]),
    CONSTRAINT [FK_warehouse_grid_locations_renter] FOREIGN KEY ([renter_id]) REFERENCES [users] ([user_id]),
    CONSTRAINT [FK_warehouse_grid_locations_wh] FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses] ([warehouse_id]) ON DELETE CASCADE
);

CREATE INDEX [idx_warehouse_grid_locations_pos] ON [warehouse_grid_locations] ([warehouse_id], [grid_x], [grid_y]);

CREATE INDEX [IX_warehouse_grid_locations_asset_id] ON [warehouse_grid_locations] ([asset_id]);

CREATE INDEX [IX_warehouse_grid_locations_renter_id] ON [warehouse_grid_locations] ([renter_id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260509152205_AddWarehouseGridLocation', N'9.0.0');

DROP INDEX [idx_warehouse_grid_locations_pos] ON [warehouse_grid_locations];

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[warehouse_grid_locations]') AND [c].[name] = N'grid_x');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [warehouse_grid_locations] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [warehouse_grid_locations] DROP COLUMN [grid_x];

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[warehouse_grid_locations]') AND [c].[name] = N'grid_y');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [warehouse_grid_locations] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [warehouse_grid_locations] DROP COLUMN [grid_y];

ALTER TABLE [warehouse_grid_locations] ADD [coordinates] nvarchar(max) NOT NULL DEFAULT N'';

CREATE INDEX [idx_warehouse_grid_locations_pos] ON [warehouse_grid_locations] ([warehouse_id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260509171335_UpdateWarehouseGridLocationCoordinates', N'9.0.0');

ALTER TABLE [warehouses] ADD [GatePosition] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260510050010_AddGatePositionToWarehouse', N'9.0.0');

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[contracts]') AND [c].[name] = N'status');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [contracts] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [contracts] ADD DEFAULT N'DRAFT' FOR [status];

CREATE TABLE [contract_revision_threads] (
    [thread_id] int NOT NULL IDENTITY,
    [contract_id] int NOT NULL,
    [section] nvarchar(50) NOT NULL,
    [status] nvarchar(30) NOT NULL DEFAULT N'OPEN',
    [created_by] int NOT NULL,
    [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
    [updated_at] datetime2 NULL,
    [resolved_by] int NULL,
    [resolved_at] datetime2 NULL,
    CONSTRAINT [PK_contract_revision_threads] PRIMARY KEY ([thread_id]),
    CONSTRAINT [FK_contract_revision_threads_contract] FOREIGN KEY ([contract_id]) REFERENCES [contracts] ([contract_id]),
    CONSTRAINT [FK_contract_revision_threads_resolved_by] FOREIGN KEY ([resolved_by]) REFERENCES [users] ([user_id]),
    CONSTRAINT [FK_contract_revision_threads_user] FOREIGN KEY ([created_by]) REFERENCES [users] ([user_id])
);

CREATE TABLE [contract_versions] (
    [version_id] int NOT NULL IDENTITY,
    [contract_id] int NOT NULL,
    [version_number] int NOT NULL,
    [snapshot_json] nvarchar(max) NOT NULL,
    [created_by] int NOT NULL,
    [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK_contract_versions] PRIMARY KEY ([version_id]),
    CONSTRAINT [FK_contract_versions_contract] FOREIGN KEY ([contract_id]) REFERENCES [contracts] ([contract_id]),
    CONSTRAINT [FK_contract_versions_user] FOREIGN KEY ([created_by]) REFERENCES [users] ([user_id])
);

CREATE TABLE [contract_revision_comments] (
    [comment_id] int NOT NULL IDENTITY,
    [thread_id] int NOT NULL,
    [user_id] int NOT NULL,
    [message] nvarchar(max) NOT NULL,
    [created_at] datetime2 NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK_contract_revision_comments] PRIMARY KEY ([comment_id]),
    CONSTRAINT [FK_contract_revision_comments_thread] FOREIGN KEY ([thread_id]) REFERENCES [contract_revision_threads] ([thread_id]),
    CONSTRAINT [FK_contract_revision_comments_user] FOREIGN KEY ([user_id]) REFERENCES [users] ([user_id])
);

CREATE INDEX [idx_contract_revision_comments_thread] ON [contract_revision_comments] ([thread_id]);

CREATE INDEX [IX_contract_revision_comments_user_id] ON [contract_revision_comments] ([user_id]);

CREATE INDEX [idx_contract_revision_threads_contract] ON [contract_revision_threads] ([contract_id]);

CREATE INDEX [IX_contract_revision_threads_created_by] ON [contract_revision_threads] ([created_by]);

CREATE INDEX [IX_contract_revision_threads_resolved_by] ON [contract_revision_threads] ([resolved_by]);

CREATE INDEX [idx_contract_versions_contract] ON [contract_versions] ([contract_id]);

CREATE INDEX [idx_contract_versions_contract_version] ON [contract_versions] ([contract_id], [version_number]);

CREATE INDEX [IX_contract_versions_created_by] ON [contract_versions] ([created_by]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260511003743_AddContractNegotiation', N'9.0.0');

COMMIT;
GO

