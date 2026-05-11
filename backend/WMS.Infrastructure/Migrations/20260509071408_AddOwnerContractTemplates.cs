using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerContractTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "owner_contract_templates",
                columns: table => new
                {
                    template_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    owner_id = table.Column<int>(type: "int", nullable: false),
                    template_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    use_basic_info_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_payment_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_violation_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_termination_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_signature_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    basic_info_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    payment_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    violation_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    termination_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    signature_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_default = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_owner_contract_templates", x => x.template_id);
                    table.ForeignKey(
                        name: "FK_owner_contract_templates_owner",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateIndex(
                name: "idx_owner_contract_templates_default",
                table: "owner_contract_templates",
                columns: new[] { "owner_id", "is_default" });

            migrationBuilder.CreateIndex(
                name: "idx_owner_contract_templates_owner",
                table: "owner_contract_templates",
                column: "owner_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "owner_contract_templates");
        }
    }
}
