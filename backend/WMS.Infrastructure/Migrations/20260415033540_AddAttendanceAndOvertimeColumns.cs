using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    public partial class AddAttendanceAndOvertimeColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "check_in_at",
                table: "staff_shifts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "check_in_photo",
                table: "staff_shifts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "check_out_at",
                table: "staff_shifts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "check_out_photo",
                table: "staff_shifts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "overtime_hours",
                table: "staff_shifts",
                type: "decimal(4,1)",
                nullable: false,
                defaultValue: 0m);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "check_in_at",    table: "staff_shifts");
            migrationBuilder.DropColumn(name: "check_in_photo", table: "staff_shifts");
            migrationBuilder.DropColumn(name: "check_out_at",   table: "staff_shifts");
            migrationBuilder.DropColumn(name: "check_out_photo",table: "staff_shifts");
            migrationBuilder.DropColumn(name: "overtime_hours", table: "staff_shifts");
        }
    }
}
