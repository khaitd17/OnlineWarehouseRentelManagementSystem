using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSpatialDataToWarehouseAndRentalArea : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Length",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Width",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Length",
                table: "rental_areas",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PositionX",
                table: "rental_areas",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PositionY",
                table: "rental_areas",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Width",
                table: "rental_areas",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "assigned_to",
                table: "audit_sessions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "recorded_by",
                table: "audit_results",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_audit_sessions_assigned_to",
                table: "audit_sessions",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_audit_results_recorded_by",
                table: "audit_results",
                column: "recorded_by");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_results_recorded_by",
                table: "audit_results",
                column: "recorded_by",
                principalTable: "users",
                principalColumn: "user_id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_sessions_assigned_to",
                table: "audit_sessions",
                column: "assigned_to",
                principalTable: "users",
                principalColumn: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_results_recorded_by",
                table: "audit_results");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_sessions_assigned_to",
                table: "audit_sessions");

            migrationBuilder.DropIndex(
                name: "IX_audit_sessions_assigned_to",
                table: "audit_sessions");

            migrationBuilder.DropIndex(
                name: "IX_audit_results_recorded_by",
                table: "audit_results");

            migrationBuilder.DropColumn(
                name: "Length",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "Length",
                table: "rental_areas");

            migrationBuilder.DropColumn(
                name: "PositionX",
                table: "rental_areas");

            migrationBuilder.DropColumn(
                name: "PositionY",
                table: "rental_areas");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "rental_areas");

            migrationBuilder.DropColumn(
                name: "assigned_to",
                table: "audit_sessions");

            migrationBuilder.DropColumn(
                name: "recorded_by",
                table: "audit_results");
        }
    }
}
