using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProposedAreaToRentalRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "base_rental_area_id",
                table: "rental_requests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_custom_area",
                table: "rental_requests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "proposed_length",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "proposed_position_x",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "proposed_position_y",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "proposed_width",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "renter_signature_base64",
                table: "inventory_requests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "staff_signature_base64",
                table: "inventory_requests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedVolume",
                table: "inventory_items",
                type: "decimal(10,3)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VerifiedVolume",
                table: "inventory_items",
                type: "decimal(10,3)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VerifiedWeight",
                table: "inventory_items",
                type: "decimal(10,3)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "base_rental_area_id",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "is_custom_area",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "proposed_length",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "proposed_position_x",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "proposed_position_y",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "proposed_width",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "renter_signature_base64",
                table: "inventory_requests");

            migrationBuilder.DropColumn(
                name: "staff_signature_base64",
                table: "inventory_requests");

            migrationBuilder.DropColumn(
                name: "EstimatedVolume",
                table: "inventory_items");

            migrationBuilder.DropColumn(
                name: "VerifiedVolume",
                table: "inventory_items");

            migrationBuilder.DropColumn(
                name: "VerifiedWeight",
                table: "inventory_items");
        }
    }
}
