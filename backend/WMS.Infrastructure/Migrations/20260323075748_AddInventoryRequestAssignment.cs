using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryRequestAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "assigned_at",
                table: "inventory_requests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "assigned_note",
                table: "inventory_requests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "assigned_staff_id",
                table: "inventory_requests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_inventory_requests_assigned_staff_id",
                table: "inventory_requests",
                column: "assigned_staff_id");

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_requests_assigned_staff",
                table: "inventory_requests",
                column: "assigned_staff_id",
                principalTable: "users",
                principalColumn: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inventory_requests_assigned_staff",
                table: "inventory_requests");

            migrationBuilder.DropIndex(
                name: "IX_inventory_requests_assigned_staff_id",
                table: "inventory_requests");

            migrationBuilder.DropColumn(
                name: "assigned_at",
                table: "inventory_requests");

            migrationBuilder.DropColumn(
                name: "assigned_note",
                table: "inventory_requests");

            migrationBuilder.DropColumn(
                name: "assigned_staff_id",
                table: "inventory_requests");
        }
    }
}
