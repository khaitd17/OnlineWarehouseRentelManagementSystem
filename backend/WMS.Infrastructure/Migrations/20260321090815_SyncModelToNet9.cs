using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelToNet9 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropColumn(
            //     name: "LegalStatus",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "Length",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "MainDoorDirection",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "Width",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "close_time",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "has_zone",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "is_24_hours_access",
            //     table: "warehouses");

            // migrationBuilder.DropColumn(
            //     name: "open_time",
            //     table: "warehouses");

            // migrationBuilder.AddColumn<string>(
            //     name: "document_urls",
            //     table: "inventory_requests",
            //     type: "nvarchar(max)",
            //     nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "document_urls",
                table: "inventory_requests");

            migrationBuilder.AddColumn<string>(
                name: "LegalStatus",
                table: "warehouses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Length",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MainDoorDirection",
                table: "warehouses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Width",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "close_time",
                table: "warehouses",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "has_zone",
                table: "warehouses",
                type: "bit",
                nullable: false,
                defaultValue: false);

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
    }
}
