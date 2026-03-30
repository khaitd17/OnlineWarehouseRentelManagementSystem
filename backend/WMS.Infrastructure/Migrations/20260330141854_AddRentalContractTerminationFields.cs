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
            migrationBuilder.AddColumn<DateTime>(
                name: "terminated_at",
                table: "contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "termination_reason",
                table: "contracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "terminated_at",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "termination_reason",
                table: "rental_contracts",
                type: "nvarchar(max)",
                nullable: true);
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
