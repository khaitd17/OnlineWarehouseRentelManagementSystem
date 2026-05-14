using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WMS.Infrastructure.Persistence;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260514090000_AddReceiptItemDimensions")]
    public partial class AddReceiptItemDimensions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "measured_length",
                table: "receipt_items",
                type: "decimal(10, 3)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "measured_width",
                table: "receipt_items",
                type: "decimal(10, 3)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "length_per_unit",
                table: "renter_assets",
                type: "decimal(10, 3)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "width_per_unit",
                table: "renter_assets",
                type: "decimal(10, 3)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "measured_length",
                table: "receipt_items");

            migrationBuilder.DropColumn(
                name: "measured_width",
                table: "receipt_items");

            migrationBuilder.DropColumn(
                name: "length_per_unit",
                table: "renter_assets");

            migrationBuilder.DropColumn(
                name: "width_per_unit",
                table: "renter_assets");
        }
    }
}
