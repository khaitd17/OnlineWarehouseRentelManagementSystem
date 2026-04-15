using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintToEquipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_equipments_iot",
                table: "equipments");

            migrationBuilder.CreateIndex(
                name: "UQ__equipments__iot",
                table: "equipments",
                column: "iot_device_id",
                unique: true,
                filter: "[iot_device_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UQ__equipments__serial",
                table: "equipments",
                column: "serial_number",
                unique: true,
                filter: "[serial_number] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ__equipments__iot",
                table: "equipments");

            migrationBuilder.DropIndex(
                name: "UQ__equipments__serial",
                table: "equipments");

            migrationBuilder.DropColumn(
                name: "is_manual",
                table: "task_types");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_iot",
                table: "equipments",
                column: "iot_device_id");
        }
    }
}
