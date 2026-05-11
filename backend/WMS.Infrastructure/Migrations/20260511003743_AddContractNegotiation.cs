using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContractNegotiation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "contracts",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true,
                defaultValue: "DRAFT",
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true,
                oldDefaultValue: "PENDING_OWNER_SIGNATURE");

            migrationBuilder.CreateTable(
                name: "contract_revision_threads",
                columns: table => new
                {
                    thread_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    section = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "OPEN"),
                    created_by = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    resolved_by = table.Column<int>(type: "int", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_revision_threads", x => x.thread_id);
                    table.ForeignKey(
                        name: "FK_contract_revision_threads_contract",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_revision_threads_resolved_by",
                        column: x => x.resolved_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_contract_revision_threads_user",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "contract_versions",
                columns: table => new
                {
                    version_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    version_number = table.Column<int>(type: "int", nullable: false),
                    snapshot_json = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_by = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_versions", x => x.version_id);
                    table.ForeignKey(
                        name: "FK_contract_versions_contract",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_versions_user",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "contract_revision_comments",
                columns: table => new
                {
                    comment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    thread_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_revision_comments", x => x.comment_id);
                    table.ForeignKey(
                        name: "FK_contract_revision_comments_thread",
                        column: x => x.thread_id,
                        principalTable: "contract_revision_threads",
                        principalColumn: "thread_id");
                    table.ForeignKey(
                        name: "FK_contract_revision_comments_user",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateIndex(
                name: "idx_contract_revision_comments_thread",
                table: "contract_revision_comments",
                column: "thread_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_revision_comments_user_id",
                table: "contract_revision_comments",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_contract_revision_threads_contract",
                table: "contract_revision_threads",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_revision_threads_created_by",
                table: "contract_revision_threads",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_contract_revision_threads_resolved_by",
                table: "contract_revision_threads",
                column: "resolved_by");

            migrationBuilder.CreateIndex(
                name: "idx_contract_versions_contract",
                table: "contract_versions",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_contract_versions_contract_version",
                table: "contract_versions",
                columns: new[] { "contract_id", "version_number" });

            migrationBuilder.CreateIndex(
                name: "IX_contract_versions_created_by",
                table: "contract_versions",
                column: "created_by");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contract_revision_comments");

            migrationBuilder.DropTable(
                name: "contract_versions");

            migrationBuilder.DropTable(
                name: "contract_revision_threads");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "contracts",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true,
                defaultValue: "PENDING_OWNER_SIGNATURE",
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true,
                oldDefaultValue: "DRAFT");
        }
    }
}
