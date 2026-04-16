using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use safe SQL to avoid errors if columns were already added by startup patches in Program.cs

            // Add WarehouseType to warehouses (safe)
            migrationBuilder.Sql(
                "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('warehouses') AND name = 'WarehouseType') " +
                "ALTER TABLE [warehouses] ADD [WarehouseType] nvarchar(max) NULL;");

            // Add is_manual to task_types (safe)
            migrationBuilder.Sql(
                "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('task_types') AND name = 'is_manual') " +
                "ALTER TABLE [task_types] ADD [is_manual] bit NOT NULL CONSTRAINT DF_task_types_is_manual DEFAULT 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WarehouseType",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "is_manual",
                table: "task_types");

            // RenameColumn removed: columns stay in PascalCase
            migrationBuilder.AlterColumn<decimal>(
                name: "EarlyTerminationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CancellationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);
        }
    }
}
