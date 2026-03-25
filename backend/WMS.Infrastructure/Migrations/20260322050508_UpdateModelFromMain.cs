using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelFromMain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF EXISTS guards to prevent failure if columns were already dropped by a previous migration
            var columnsToDrop = new[] { "LegalStatus", "Length", "MainDoorDirection", "Width", "close_time", "has_zone", "is_24_hours_access", "open_time" };
            foreach (var col in columnsToDrop)
            {
                migrationBuilder.Sql($@"
                    IF COL_LENGTH('warehouses', '{col}') IS NOT NULL
                    BEGIN
                        DECLARE @cn NVARCHAR(256);
                        SELECT @cn = dc.name
                        FROM sys.default_constraints dc
                        JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
                        WHERE dc.parent_object_id = OBJECT_ID('warehouses') AND c.name = '{col}';
                        IF @cn IS NOT NULL
                            EXEC('ALTER TABLE [warehouses] DROP CONSTRAINT [' + @cn + ']');
                        ALTER TABLE [warehouses] DROP COLUMN [{col}];
                    END
                ");
            }

            migrationBuilder.Sql(@"
                IF COL_LENGTH('warehouse_memberships', 'warehouse_shift_id') IS NULL
                BEGIN
                    ALTER TABLE [warehouse_memberships] ADD [warehouse_shift_id] INT NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF COL_LENGTH('inventory_requests', 'document_urls') IS NULL
                BEGIN
                    ALTER TABLE [inventory_requests] ADD [document_urls] NVARCHAR(MAX) NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF OBJECT_ID('warehouse_shifts', 'U') IS NULL
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
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_warehouse_memberships_warehouse_shift_id' AND object_id = OBJECT_ID('warehouse_memberships'))
                BEGIN
                    CREATE INDEX [IX_warehouse_memberships_warehouse_shift_id] ON [warehouse_memberships] ([warehouse_shift_id]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_warehouse_shifts_warehouse_id' AND object_id = OBJECT_ID('warehouse_shifts'))
                BEGIN
                    CREATE INDEX [IX_warehouse_shifts_warehouse_id] ON [warehouse_shifts] ([warehouse_id]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_warehouse_memberships_warehouse_shifts_warehouse_shift_id' AND parent_object_id = OBJECT_ID('warehouse_memberships'))
                BEGIN
                    ALTER TABLE [warehouse_memberships] ADD CONSTRAINT [FK_warehouse_memberships_warehouse_shifts_warehouse_shift_id] FOREIGN KEY ([warehouse_shift_id]) REFERENCES [warehouse_shifts] ([id]);
                END
            ");
            // migrationBuilder.DropColumn(
            //     name: "LegalStatus",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "Length",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "MainDoorDirection",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "Width",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "close_time",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "has_zone",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "is_24_hours_access",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "open_time",
            //     table: "warehouses");

            // migrationBuilder.AddColumn<int>(
            //     name: "warehouse_shift_id",
            //     table: "warehouse_memberships",
            //     type: "int",
            //     nullable: true);

            // migrationBuilder.AddColumn<string>(
            //     name: "document_urls",
            //     table: "inventory_requests",
            //     type: "nvarchar(max)",
            //     nullable: true);

            // migrationBuilder.CreateTable(
            //     name: "warehouse_shifts",
            //     columns: table => new
            //     {
            //         id = table.Column<int>(type: "int", nullable: false)
            //             .Annotation("SqlServer:Identity", "1, 1"),
            //         name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
            //         start_time = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
            //         end_time = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
            //         warehouse_id = table.Column<int>(type: "int", nullable: true)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_warehouse_shifts", x => x.id);
            //         table.ForeignKey(
            //             name: "FK_warehouse_shifts_warehouses_warehouse_id",
            //             column: x => x.warehouse_id,
            //             principalTable: "warehouses",
            //             principalColumn: "warehouse_id",
            //             onDelete: ReferentialAction.Cascade);
            //     });

            // migrationBuilder.CreateIndex(
            //     name: "IX_warehouse_memberships_warehouse_shift_id",
            //     table: "warehouse_memberships",
            //     column: "warehouse_shift_id");

            // migrationBuilder.CreateIndex(
            //     name: "IX_warehouse_shifts_warehouse_id",
            //     table: "warehouse_shifts",
            //     column: "warehouse_id");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_warehouse_memberships_warehouse_shifts_warehouse_shift_id",
            //     table: "warehouse_memberships",
            //     column: "warehouse_shift_id",
            //     principalTable: "warehouse_shifts",
            //     principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_warehouse_memberships_warehouse_shifts_warehouse_shift_id",
                table: "warehouse_memberships");

            migrationBuilder.DropTable(
                name: "warehouse_shifts");

            migrationBuilder.DropIndex(
                name: "IX_warehouse_memberships_warehouse_shift_id",
                table: "warehouse_memberships");

            migrationBuilder.DropColumn(
                name: "warehouse_shift_id",
                table: "warehouse_memberships");

            migrationBuilder.DropColumn(
                name: "document_urls",
                table: "inventory_requests");

            migrationBuilder.AddColumn<string>(
                name: "LegalStatus",
                table: "warehouses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Length",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MainDoorDirection",
                table: "warehouses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Width",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "close_time",
                table: "warehouses",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "has_zone",
                table: "warehouses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_24_hours_access",
                table: "warehouses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "open_time",
                table: "warehouses",
                type: "time",
                nullable: true);
        }
    }
}
