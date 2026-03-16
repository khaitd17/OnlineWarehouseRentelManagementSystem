using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseOperatingAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "close_time",
                table: "warehouses",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_24_hours_access",
                table: "warehouses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "open_time",
                table: "warehouses",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "close_time",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "is_24_hours_access",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "open_time",
                table: "warehouses");
        }
    }
}
