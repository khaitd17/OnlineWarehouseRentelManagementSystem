using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRenterSignatureToInventoryRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "VolumePerUnit",
                table: "renter_assets",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "renter_signature_base64",
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
                name: "VolumePerUnit",
                table: "renter_assets");

            migrationBuilder.DropColumn(
                name: "renter_signature_base64",
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
