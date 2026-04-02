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
            // Tất cả các bước đều dùng IF EXISTS/IF NOT EXISTS để an toàn khi migration đã apply 1 phần
            migrationBuilder.Sql(@"
                -- Drop FK nếu còn tồn tại
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_UnitTask_tasks_WarehouseTaskId')
                    ALTER TABLE [UnitTask] DROP CONSTRAINT [FK_UnitTask_tasks_WarehouseTaskId];

                -- Drop bảng task_assignments nếu còn
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'task_assignments')
                    DROP TABLE [task_assignments];

                -- Drop PK cũ nếu còn
                IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_UnitTask')
                    ALTER TABLE [UnitTask] DROP CONSTRAINT [PK_UnitTask];

                -- Drop cột referenceId nếu còn (phải drop default constraint trước)
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tasks') AND name = 'referenceId')
                BEGIN
                    DECLARE @dfName NVARCHAR(256);
                    SELECT @dfName = d.name FROM sys.default_constraints d
                        JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
                        WHERE c.object_id = OBJECT_ID('tasks') AND c.name = 'referenceId';
                    IF @dfName IS NOT NULL
                        EXEC('ALTER TABLE [tasks] DROP CONSTRAINT [' + @dfName + ']');
                    ALTER TABLE [tasks] DROP COLUMN [referenceId];
                END

                -- Rename bảng UnitTask -> unit_tasks nếu chưa
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UnitTask') AND NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'unit_tasks')
                    EXEC sp_rename N'UnitTask', N'unit_tasks';

                -- Rename columns (chỉ chạy nếu cột cũ còn)
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'Status')
                    EXEC sp_rename N'[unit_tasks].[Status]', N'status', 'COLUMN';
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'Description')
                    EXEC sp_rename N'[unit_tasks].[Description]', N'description', 'COLUMN';
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'WarehouseTaskId')
                    EXEC sp_rename N'[unit_tasks].[WarehouseTaskId]', N'warehouse_task_id', 'COLUMN';
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'CreatedAt')
                    EXEC sp_rename N'[unit_tasks].[CreatedAt]', N'created_at', 'COLUMN';
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'Id')
                    EXEC sp_rename N'[unit_tasks].[Id]', N'unit_task_id', 'COLUMN';

                -- Rename index an toàn
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UnitTask_WarehouseTaskId' AND object_id = OBJECT_ID('unit_tasks'))
                    EXEC sp_rename N'unit_tasks.IX_UnitTask_WarehouseTaskId', N'IX_unit_tasks_warehouse_task_id', 'INDEX';

                -- Thêm cột ref_id, ref_type cho bảng tasks
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tasks') AND name = 'ref_id')
                    ALTER TABLE [tasks] ADD [ref_id] int NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tasks') AND name = 'ref_type')
                    ALTER TABLE [tasks] ADD [ref_type] nvarchar(20) NULL;

                -- Thêm các cột mới cho unit_tasks
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'completed_at')
                    ALTER TABLE [unit_tasks] ADD [completed_at] datetime2 NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'order')
                    ALTER TABLE [unit_tasks] ADD [order] int NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'unit_task_type_code')
                    ALTER TABLE [unit_tasks] ADD [unit_task_type_code] nvarchar(50) NULL;

                -- PK mới
                IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_unit_tasks')
                    ALTER TABLE [unit_tasks] ADD CONSTRAINT [PK_unit_tasks] PRIMARY KEY ([unit_task_id]);

                -- FK mới
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_unit_tasks_tasks_warehouse_task_id')
                    ALTER TABLE [unit_tasks] ADD CONSTRAINT [FK_unit_tasks_tasks_warehouse_task_id] FOREIGN KEY ([warehouse_task_id]) REFERENCES [tasks] ([task_id]);
            ");
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
