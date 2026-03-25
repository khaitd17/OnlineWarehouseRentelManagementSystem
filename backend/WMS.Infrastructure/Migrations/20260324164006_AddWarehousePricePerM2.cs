using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehousePricePerM2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PricePerM2",
                table: "warehouses",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "referenceId",
                table: "tasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "asset_id",
                table: "inventory_items",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "renter_assets",
                columns: table => new
                {
                    asset_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    asset_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "cái"),
                    weight_per_unit = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_renter_assets", x => x.asset_id);
                    table.ForeignKey(
                        name: "FK_ra_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "UnitTask",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WarehouseTaskId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitTask", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitTask_tasks_WarehouseTaskId",
                        column: x => x.WarehouseTaskId,
                        principalTable: "tasks",
                        principalColumn: "task_id");
                });

            migrationBuilder.CreateTable(
                name: "renter_inventory",
                columns: table => new
                {
                    inventory_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    asset_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_renter_inventory", x => x.inventory_id);
                    table.ForeignKey(
                        name: "FK_ri_asset",
                        column: x => x.asset_id,
                        principalTable: "renter_assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ri_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateIndex(
                name: "idx_inventory_items_asset",
                table: "inventory_items",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "idx_ra_renter",
                table: "renter_assets",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "idx_ri_asset",
                table: "renter_inventory",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "idx_ri_warehouse",
                table: "renter_inventory",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "UQ_renter_inventory",
                table: "renter_inventory",
                columns: new[] { "asset_id", "warehouse_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UnitTask_WarehouseTaskId",
                table: "UnitTask",
                column: "WarehouseTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_items_asset",
                table: "inventory_items",
                column: "asset_id",
                principalTable: "renter_assets",
                principalColumn: "asset_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inventory_items_asset",
                table: "inventory_items");

            migrationBuilder.DropTable(
                name: "renter_inventory");

            migrationBuilder.DropTable(
                name: "UnitTask");

            migrationBuilder.DropTable(
                name: "renter_assets");

            migrationBuilder.DropIndex(
                name: "idx_inventory_items_asset",
                table: "inventory_items");

            migrationBuilder.DropColumn(
                name: "PricePerM2",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "referenceId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "asset_id",
                table: "inventory_items");
        }
    }
}
