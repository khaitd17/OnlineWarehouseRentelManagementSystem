using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateWarehouseGridLocationCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_warehouse_grid_locations_pos",
                table: "warehouse_grid_locations");

            migrationBuilder.DropColumn(
                name: "grid_x",
                table: "warehouse_grid_locations");

            migrationBuilder.DropColumn(
                name: "grid_y",
                table: "warehouse_grid_locations");

            migrationBuilder.AddColumn<string>(
                name: "coordinates",
                table: "warehouse_grid_locations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "idx_warehouse_grid_locations_pos",
                table: "warehouse_grid_locations",
                column: "warehouse_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_warehouse_grid_locations_pos",
                table: "warehouse_grid_locations");

            migrationBuilder.DropColumn(
                name: "coordinates",
                table: "warehouse_grid_locations");

            migrationBuilder.AddColumn<decimal>(
                name: "grid_x",
                table: "warehouse_grid_locations",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "grid_y",
                table: "warehouse_grid_locations",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "idx_warehouse_grid_locations_pos",
                table: "warehouse_grid_locations",
                columns: new[] { "warehouse_id", "grid_x", "grid_y" });
        }
    }
}
