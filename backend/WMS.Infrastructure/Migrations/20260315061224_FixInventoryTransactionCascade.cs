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
            migrationBuilder.DropForeignKey(
                name: "FK_warehouse_media_warehouses_WarehouseId1",
                table: "warehouse_media");

            migrationBuilder.DropIndex(
                name: "IX_warehouse_media_WarehouseId1",
                table: "warehouse_media");

            migrationBuilder.DropColumn(
                name: "WarehouseId1",
                table: "warehouse_media");

            migrationBuilder.CreateTable(
                name: "inventory_transactions",
                columns: table => new
                {
                    transaction_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    inv_req_id = table.Column<int>(type: "int", nullable: false),
                    type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "cái"),
                    performed_by = table.Column<int>(type: "int", nullable: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_transactions", x => x.transaction_id);
                    table.ForeignKey(
                        name: "FK_inv_transactions_performer",
                        column: x => x.performed_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_inv_transactions_request",
                        column: x => x.inv_req_id,
                        principalTable: "inventory_requests",
                        principalColumn: "inv_req_id");
                    table.ForeignKey(
                        name: "FK_inv_transactions_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_inventory",
                columns: table => new
                {
                    inventory_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "cái"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_inventory", x => x.inventory_id);
                    table.ForeignKey(
                        name: "FK_warehouse_inventory_wh",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_inv_transactions_created",
                table: "inventory_transactions",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_inv_transactions_type",
                table: "inventory_transactions",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "idx_inv_transactions_warehouse",
                table: "inventory_transactions",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_transactions_inv_req_id",
                table: "inventory_transactions",
                column: "inv_req_id");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_transactions_performed_by",
                table: "inventory_transactions",
                column: "performed_by");

            migrationBuilder.CreateIndex(
                name: "UQ_warehouse_inventory_item",
                table: "warehouse_inventory",
                columns: new[] { "warehouse_id", "item_name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventory_transactions");

            migrationBuilder.DropTable(
                name: "warehouse_inventory");

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
