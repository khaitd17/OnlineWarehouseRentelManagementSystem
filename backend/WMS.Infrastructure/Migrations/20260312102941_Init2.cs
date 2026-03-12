using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Init2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_warehouse_memberships_warehouses_warehouse_id",
                table: "warehouse_memberships");

            migrationBuilder.AddForeignKey(
                name: "FK_warehouse_memberships_warehouses_warehouse_id",
                table: "warehouse_memberships",
                column: "warehouse_id",
                principalTable: "warehouses",
                principalColumn: "warehouse_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_warehouse_memberships_warehouses_warehouse_id",
                table: "warehouse_memberships");

            migrationBuilder.AddForeignKey(
                name: "FK_warehouse_memberships_warehouses_warehouse_id",
                table: "warehouse_memberships",
                column: "warehouse_id",
                principalTable: "warehouses",
                principalColumn: "warehouse_id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
