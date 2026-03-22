using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseShiftTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "warehouse_shift_id",
                table: "warehouse_memberships",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "warehouse_shifts",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    start_time = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    end_time = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_shifts", x => x.id);
                    table.ForeignKey(
                        name: "FK_warehouse_shifts_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_memberships_warehouse_shift_id",
                table: "warehouse_memberships",
                column: "warehouse_shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_shifts_warehouse_id",
                table: "warehouse_shifts",
                column: "warehouse_id");

            migrationBuilder.AddForeignKey(
                name: "FK_warehouse_memberships_warehouse_shifts_warehouse_shift_id",
                table: "warehouse_memberships",
                column: "warehouse_shift_id",
                principalTable: "warehouse_shifts",
                principalColumn: "id");
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
        }
    }
}
