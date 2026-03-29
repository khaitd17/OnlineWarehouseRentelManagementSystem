using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskRefTypeRefIdCompletedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UnitTask_tasks_WarehouseTaskId",
                table: "UnitTask");

            migrationBuilder.DropTable(
                name: "task_assignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UnitTask",
                table: "UnitTask");

            migrationBuilder.DropColumn(
                name: "referenceId",
                table: "tasks");

            migrationBuilder.RenameTable(
                name: "UnitTask",
                newName: "unit_tasks");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "unit_tasks",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "unit_tasks",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "WarehouseTaskId",
                table: "unit_tasks",
                newName: "warehouse_task_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "unit_tasks",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "unit_tasks",
                newName: "unit_task_id");

            migrationBuilder.RenameIndex(
                name: "IX_UnitTask_WarehouseTaskId",
                table: "unit_tasks",
                newName: "IX_unit_tasks_warehouse_task_id");

            migrationBuilder.AddColumn<int>(
                name: "ref_id",
                table: "tasks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ref_type",
                table: "tasks",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "unit_tasks",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "unit_tasks",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "(getdate())",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "completed_at",
                table: "unit_tasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "order",
                table: "unit_tasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "unit_task_type_code",
                table: "unit_tasks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_unit_tasks",
                table: "unit_tasks",
                column: "unit_task_id");

            migrationBuilder.AddForeignKey(
                name: "FK_unit_tasks_tasks_warehouse_task_id",
                table: "unit_tasks",
                column: "warehouse_task_id",
                principalTable: "tasks",
                principalColumn: "task_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_unit_tasks_tasks_warehouse_task_id",
                table: "unit_tasks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_unit_tasks",
                table: "unit_tasks");

            migrationBuilder.DropColumn(
                name: "ref_id",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "ref_type",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "completed_at",
                table: "unit_tasks");

            migrationBuilder.DropColumn(
                name: "order",
                table: "unit_tasks");

            migrationBuilder.DropColumn(
                name: "unit_task_type_code",
                table: "unit_tasks");

            migrationBuilder.RenameTable(
                name: "unit_tasks",
                newName: "UnitTask");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "UnitTask",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "UnitTask",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "warehouse_task_id",
                table: "UnitTask",
                newName: "WarehouseTaskId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "UnitTask",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "unit_task_id",
                table: "UnitTask",
                newName: "Id");

            migrationBuilder.RenameIndex(
                name: "IX_unit_tasks_warehouse_task_id",
                table: "UnitTask",
                newName: "IX_UnitTask_WarehouseTaskId");

            migrationBuilder.AddColumn<int>(
                name: "referenceId",
                table: "tasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "UnitTask",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Pending");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "UnitTask",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "(getdate())");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UnitTask",
                table: "UnitTask",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "task_assignments",
                columns: table => new
                {
                    assignment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    membership_id = table.Column<int>(type: "int", nullable: false),
                    task_id = table.Column<int>(type: "int", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_assignments", x => x.assignment_id);
                    table.ForeignKey(
                        name: "FK_task_assignments_tasks_task_id",
                        column: x => x.task_id,
                        principalTable: "tasks",
                        principalColumn: "task_id");
                    table.ForeignKey(
                        name: "FK_task_assignments_warehouse_memberships_membership_id",
                        column: x => x.membership_id,
                        principalTable: "warehouse_memberships",
                        principalColumn: "membership_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_task_assignments_membership_id",
                table: "task_assignments",
                column: "membership_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_assignments_task_id",
                table: "task_assignments",
                column: "task_id");

            migrationBuilder.AddForeignKey(
                name: "FK_UnitTask_tasks_WarehouseTaskId",
                table: "UnitTask",
                column: "WarehouseTaskId",
                principalTable: "tasks",
                principalColumn: "task_id");
        }
    }
}
