using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditAssignmentAndRecording : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.AddColumn<int>(
            //     name: "assigned_to",
            //     table: "audit_sessions",
            //     type: "int",
            //     nullable: true);

            // migrationBuilder.AddColumn<int>(
            //     name: "recorded_by",
            //     table: "audit_results",
            //     type: "int",
            //     nullable: true);

            // migrationBuilder.CreateIndex(
            //     name: "IX_audit_sessions_assigned_to",
            //     table: "audit_sessions",
            //     column: "assigned_to");

            // migrationBuilder.CreateIndex(
            //     name: "IX_audit_results_recorded_by",
            //     table: "audit_results",
            //     column: "recorded_by");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_audit_results_recorded_by",
            //     table: "audit_results",
            //     column: "recorded_by",
            //     principalTable: "users",
            //     principalColumn: "user_id");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_audit_sessions_assigned_to",
            //     table: "audit_sessions",
            //     column: "assigned_to",
            //     principalTable: "users",
            //     principalColumn: "user_id");

            // Drop old CHECK constraint and add updated one with new status values
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_audit_sessions_status')
                    ALTER TABLE [audit_sessions] DROP CONSTRAINT [CHK_audit_sessions_status];

                ALTER TABLE [audit_sessions]
                ADD CONSTRAINT [CHK_audit_sessions_status]
                CHECK ([status] IN ('OPEN','PENDING_APPROVAL','APPROVED','IN_PROGRESS','COMPLETED','REJECTED'));
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_results_recorded_by",
                table: "audit_results");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_sessions_assigned_to",
                table: "audit_sessions");

            migrationBuilder.DropIndex(
                name: "IX_audit_sessions_assigned_to",
                table: "audit_sessions");

            migrationBuilder.DropIndex(
                name: "IX_audit_results_recorded_by",
                table: "audit_results");

            migrationBuilder.DropColumn(
                name: "assigned_to",
                table: "audit_sessions");

            migrationBuilder.DropColumn(
                name: "recorded_by",
                table: "audit_results");

            // Restore original CHECK constraint
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_audit_sessions_status')
                    ALTER TABLE [audit_sessions] DROP CONSTRAINT [CHK_audit_sessions_status];

                ALTER TABLE [audit_sessions]
                ADD CONSTRAINT [CHK_audit_sessions_status]
                CHECK ([status] IN ('OPEN','IN_PROGRESS','COMPLETED'));
            ");
        }
    }
}
