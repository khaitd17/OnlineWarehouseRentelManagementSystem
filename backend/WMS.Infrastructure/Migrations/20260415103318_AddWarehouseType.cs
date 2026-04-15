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
            migrationBuilder.RenameColumn(
                name: "early_termination_fee",
                table: "rental_contracts",
                newName: "EarlyTerminationFee");

            migrationBuilder.RenameColumn(
                name: "cancellation_fee",
                table: "rental_contracts",
                newName: "CancellationFee");

            migrationBuilder.AddColumn<string>(
                name: "WarehouseType",
                table: "warehouses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_manual",
                table: "task_types",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<decimal>(
                name: "EarlyTerminationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(15,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CancellationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(15,2)",
                oldNullable: true);
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

            migrationBuilder.RenameColumn(
                name: "EarlyTerminationFee",
                table: "rental_contracts",
                newName: "early_termination_fee");

            migrationBuilder.RenameColumn(
                name: "CancellationFee",
                table: "rental_contracts",
                newName: "cancellation_fee");

            migrationBuilder.AlterColumn<decimal>(
                name: "early_termination_fee",
                table: "rental_contracts",
                type: "decimal(15,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "cancellation_fee",
                table: "rental_contracts",
                type: "decimal(15,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);
        }
    }
}
