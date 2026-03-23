using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixInventoryTransactionCascade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // These objects may not exist if the DB was created fresh from InitFull
            // Use IF EXISTS guards to make this migration idempotent
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_warehouse_media_warehouses_WarehouseId1')
                BEGIN
                    ALTER TABLE [warehouse_media] DROP CONSTRAINT [FK_warehouse_media_warehouses_WarehouseId1];
                END
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes
                           WHERE name = 'IX_warehouse_media_WarehouseId1'
                             AND object_id = OBJECT_ID('warehouse_media'))
                BEGIN
                    DROP INDEX [IX_warehouse_media_WarehouseId1] ON [warehouse_media];
                END
            ");

            migrationBuilder.Sql(@"
                IF COL_LENGTH('warehouse_media', 'WarehouseId1') IS NOT NULL
                BEGIN
                    ALTER TABLE [warehouse_media] DROP COLUMN [WarehouseId1];
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'inventory_transactions')
                BEGIN
                    CREATE TABLE [inventory_transactions] (
                        [transaction_id]  INT            NOT NULL IDENTITY(1,1),
                        [inv_req_id]      INT            NOT NULL,
                        [type]            NVARCHAR(20)   NOT NULL,
                        [warehouse_id]    INT            NOT NULL,
                        [item_name]       NVARCHAR(200)  NOT NULL,
                        [quantity]        INT            NOT NULL,
                        [unit]            NVARCHAR(50)   NOT NULL DEFAULT N'cái',
                        [performed_by]    INT            NOT NULL,
                        [notes]           NVARCHAR(MAX)  NULL,
                        [created_at]      DATETIME2      NOT NULL DEFAULT (getdate()),
                        CONSTRAINT [PK_inventory_transactions] PRIMARY KEY ([transaction_id]),
                        CONSTRAINT [FK_inv_transactions_performer]
                            FOREIGN KEY ([performed_by]) REFERENCES [users]([user_id]),
                        CONSTRAINT [FK_inv_transactions_request]
                            FOREIGN KEY ([inv_req_id]) REFERENCES [inventory_requests]([inv_req_id]),
                        CONSTRAINT [FK_inv_transactions_warehouse]
                            FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses]([warehouse_id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [idx_inv_transactions_created]   ON [inventory_transactions] ([created_at]);
                    CREATE INDEX [idx_inv_transactions_type]      ON [inventory_transactions] ([type]);
                    CREATE INDEX [idx_inv_transactions_warehouse] ON [inventory_transactions] ([warehouse_id]);
                    CREATE INDEX [IX_inventory_transactions_inv_req_id]    ON [inventory_transactions] ([inv_req_id]);
                    CREATE INDEX [IX_inventory_transactions_performed_by]  ON [inventory_transactions] ([performed_by]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'warehouse_inventory')
                BEGIN
                    CREATE TABLE [warehouse_inventory] (
                        [inventory_id]  INT            NOT NULL IDENTITY(1,1),
                        [warehouse_id]  INT            NOT NULL,
                        [item_name]     NVARCHAR(200)  NOT NULL,
                        [quantity]      INT            NOT NULL,
                        [unit]          NVARCHAR(50)   NOT NULL DEFAULT N'cái',
                        [updated_at]    DATETIME2      NOT NULL DEFAULT (getdate()),
                        CONSTRAINT [PK_warehouse_inventory] PRIMARY KEY ([inventory_id]),
                        CONSTRAINT [FK_warehouse_inventory_wh]
                            FOREIGN KEY ([warehouse_id]) REFERENCES [warehouses]([warehouse_id]) ON DELETE CASCADE,
                        CONSTRAINT [UQ_warehouse_inventory_item] UNIQUE ([warehouse_id], [item_name])
                    );
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "inventory_transactions");
            migrationBuilder.DropTable(name: "warehouse_inventory");

            migrationBuilder.AddColumn<int>(
                name: "WarehouseId1",
                table: "warehouse_media",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_media_WarehouseId1",
                table: "warehouse_media",
                column: "WarehouseId1");

            migrationBuilder.AddForeignKey(
                name: "FK_warehouse_media_warehouses_WarehouseId1",
                table: "warehouse_media",
                column: "WarehouseId1",
                principalTable: "warehouses",
                principalColumn: "warehouse_id");
        }
    }
}
