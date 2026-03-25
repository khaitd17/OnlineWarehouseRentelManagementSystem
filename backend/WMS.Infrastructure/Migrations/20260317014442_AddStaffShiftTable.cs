using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffShiftTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "rental_areas",
                columns: table => new
                {
                    rental_area_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    size = table.Column<double>(type: "float", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_areas", x => x.rental_area_id);
                    table.ForeignKey(
                        name: "FK_rental_areas_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "staff_shifts",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    membership_id = table.Column<int>(type: "int", nullable: false),
                    shift_date = table.Column<DateOnly>(type: "date", nullable: false),
                    time_in1 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    time_out1 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    time_in2 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    time_out2 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    shift_type = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_shifts", x => x.id);
                    table.ForeignKey(
                        name: "FK_staff_shifts_membership",
                        column: x => x.membership_id,
                        principalTable: "warehouse_memberships",
                        principalColumn: "membership_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_rental_areas_warehouse_id",
                table: "rental_areas",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "UQ_staff_shifts_membership_date",
                table: "staff_shifts",
                columns: new[] { "membership_id", "shift_date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "rental_areas");

            migrationBuilder.DropTable(
                name: "staff_shifts");
        }
    }
}
