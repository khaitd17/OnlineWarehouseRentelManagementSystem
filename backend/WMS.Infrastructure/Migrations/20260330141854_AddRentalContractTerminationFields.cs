using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRentalContractTerminationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'terminated_at') ALTER TABLE contracts ADD terminated_at datetime2 NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'termination_reason') ALTER TABLE contracts ADD termination_reason nvarchar(max) NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'terminated_at') ALTER TABLE rental_contracts ADD terminated_at datetime2 NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'termination_reason') ALTER TABLE rental_contracts ADD termination_reason nvarchar(max) NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "terminated_at",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "termination_reason",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "terminated_at",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "termination_reason",
                table: "rental_contracts");
        }
    }
}
