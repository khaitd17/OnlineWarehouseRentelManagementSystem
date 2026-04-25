using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExtensionZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "extension_length",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "extension_position_x",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "extension_position_y",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "extension_width",
                table: "rental_requests",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "has_extension_zone",
                table: "rental_requests",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "extension_length",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "extension_position_x",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "extension_position_y",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "extension_width",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "has_extension_zone",
                table: "rental_requests");
        }
    }
}
