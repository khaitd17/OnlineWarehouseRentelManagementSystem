using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseGridLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {


            migrationBuilder.CreateTable(
                name: "warehouse_grid_locations",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    grid_x = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    grid_y = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    asset_id = table.Column<int>(type: "int", nullable: true),
                    item_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    renter_id = table.Column<int>(type: "int", nullable: true),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_grid_locations", x => x.id);
                    table.ForeignKey(
                        name: "FK_warehouse_grid_locations_asset",
                        column: x => x.asset_id,
                        principalTable: "renter_assets",
                        principalColumn: "asset_id");
                    table.ForeignKey(
                        name: "FK_warehouse_grid_locations_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_warehouse_grid_locations_wh",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_warehouse_grid_locations_pos",
                table: "warehouse_grid_locations",
                columns: new[] { "warehouse_id", "grid_x", "grid_y" });

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_grid_locations_asset_id",
                table: "warehouse_grid_locations",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_grid_locations_renter_id",
                table: "warehouse_grid_locations",
                column: "renter_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "warehouse_grid_locations");


        }
    }
}
