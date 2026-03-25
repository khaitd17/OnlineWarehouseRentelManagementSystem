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
                name: "UQ_staff_shifts_membership_date",
                table: "staff_shifts",
                columns: new[] { "membership_id", "shift_date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "staff_shifts");
        }
    }
}
