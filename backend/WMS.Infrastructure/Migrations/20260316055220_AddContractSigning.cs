using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContractSigning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "signed_at",
                table: "contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "signed_file_url",
                table: "contracts",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "terms",
                table: "contracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "contract_logs",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ip_address = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_logs", x => x.log_id);
                });

            migrationBuilder.CreateTable(
                name: "contract_verifications",
                columns: table => new
                {
                    verification_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    otp_code = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    is_verified = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    verified_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_verifications", x => x.verification_id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_cl_contract",
                table: "contract_logs",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_cv_contract",
                table: "contract_verifications",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_cv_user",
                table: "contract_verifications",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contract_logs");

            migrationBuilder.DropTable(
                name: "contract_verifications");

            migrationBuilder.DropColumn(
                name: "signed_at",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "signed_file_url",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "terms",
                table: "contracts");
        }
    }
}
