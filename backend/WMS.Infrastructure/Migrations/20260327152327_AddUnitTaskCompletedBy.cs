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
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('unit_tasks') AND name = 'completed_by')
                    ALTER TABLE [unit_tasks] ADD [completed_by] int NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_unit_tasks_completed_by' AND object_id = OBJECT_ID('unit_tasks'))
                    CREATE INDEX [IX_unit_tasks_completed_by] ON [unit_tasks] ([completed_by]);

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_unit_tasks_users_completed_by')
                    ALTER TABLE [unit_tasks] ADD CONSTRAINT [FK_unit_tasks_users_completed_by] FOREIGN KEY ([completed_by]) REFERENCES [users] ([user_id]);
            ");
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
