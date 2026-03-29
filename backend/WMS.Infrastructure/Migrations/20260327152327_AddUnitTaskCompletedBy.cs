using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitTaskCompletedBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "completed_by",
                table: "unit_tasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_unit_tasks_completed_by",
                table: "unit_tasks",
                column: "completed_by");

            migrationBuilder.AddForeignKey(
                name: "FK_unit_tasks_users_completed_by",
                table: "unit_tasks",
                column: "completed_by",
                principalTable: "users",
                principalColumn: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_unit_tasks_users_completed_by",
                table: "unit_tasks");

            migrationBuilder.DropIndex(
                name: "IX_unit_tasks_completed_by",
                table: "unit_tasks");

            migrationBuilder.DropColumn(
                name: "completed_by",
                table: "unit_tasks");
        }
    }
}
