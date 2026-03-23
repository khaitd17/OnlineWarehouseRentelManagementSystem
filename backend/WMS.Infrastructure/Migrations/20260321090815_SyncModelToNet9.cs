using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelToNet9 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF EXISTS guards so this migration works on both
            // existing databases (where columns exist) and fresh databases (where they don't)
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
                IF COL_LENGTH('inventory_requests', 'document_urls') IS NULL
                BEGIN
                    ALTER TABLE [inventory_requests] ADD [document_urls] NVARCHAR(MAX) NULL;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
