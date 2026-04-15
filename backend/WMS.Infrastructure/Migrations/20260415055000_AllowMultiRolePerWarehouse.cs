using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations;

/// <summary>
/// Cho phép 1 user có nhiều role khác nhau trong cùng 1 kho.
/// Đổi unique constraint từ (user_id, warehouse_id)
/// thành (user_id, warehouse_id, warehouse_role_id).
/// Lý do: chủ kho cần 2 memberships — OWNER (thương mại) và OPERATOR (vận hành)
/// để có thể bàn giao quyền vận hành mà không ảnh hưởng quyền thương mại.
/// </summary>
public partial class AllowMultiRolePerWarehouse : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Xoá unique index cũ (user_id, warehouse_id)
        migrationBuilder.DropIndex(
            name: "IX_warehouse_memberships_user_id_warehouse_id",
            table: "warehouse_memberships");

        // Tạo unique index mới (user_id, warehouse_id, warehouse_role_id)
        migrationBuilder.CreateIndex(
            name: "IX_warehouse_memberships_user_warehouse_role",
            table: "warehouse_memberships",
            columns: new[] { "user_id", "warehouse_id", "warehouse_role_id" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_warehouse_memberships_user_warehouse_role",
            table: "warehouse_memberships");

        migrationBuilder.CreateIndex(
            name: "IX_warehouse_memberships_user_id_warehouse_id",
            table: "warehouse_memberships",
            columns: new[] { "user_id", "warehouse_id" },
            unique: true);
    }
}
