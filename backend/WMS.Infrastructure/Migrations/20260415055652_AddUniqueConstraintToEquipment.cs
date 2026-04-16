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
            // Drop old index nếu tồn tại (safe)
            migrationBuilder.Sql(
                "IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('equipments') AND name = 'idx_equipments_iot') " +
                "DROP INDEX [idx_equipments_iot] ON [equipments];");

            // Create unique index cho iot_device_id nếu chưa tồn tại (safe)
            migrationBuilder.Sql(
                "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('equipments') AND name = 'UQ__equipments__iot') " +
                "CREATE UNIQUE INDEX [UQ__equipments__iot] ON [equipments] ([iot_device_id]) WHERE [iot_device_id] IS NOT NULL;");

            // Create unique index cho serial_number nếu chưa tồn tại (safe)
            migrationBuilder.Sql(
                "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('equipments') AND name = 'UQ__equipments__serial') " +
                "CREATE UNIQUE INDEX [UQ__equipments__serial] ON [equipments] ([serial_number]) WHERE [serial_number] IS NOT NULL;");
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
