using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseHeight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Height",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "additional_zones_json",
                table: "rental_requests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_owner_assigned",
                table: "rental_requests",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Height",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "additional_zones_json",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "is_owner_assigned",
                table: "rental_requests");

            migrationBuilder.RenameColumn(
                name: "VolumePerUnit",
                table: "renter_assets",
                newName: "volume_per_unit");

            migrationBuilder.RenameColumn(
                name: "has_extension_zone",
                table: "rental_requests",
                newName: "HasExtensionZone");

            migrationBuilder.RenameColumn(
                name: "extension_width",
                table: "rental_requests",
                newName: "ExtensionWidth");

            migrationBuilder.RenameColumn(
                name: "extension_position_y",
                table: "rental_requests",
                newName: "ExtensionPositionY");

            migrationBuilder.RenameColumn(
                name: "extension_position_x",
                table: "rental_requests",
                newName: "ExtensionPositionX");

            migrationBuilder.RenameColumn(
                name: "extension_length",
                table: "rental_requests",
                newName: "ExtensionLength");
        }
    }
}
