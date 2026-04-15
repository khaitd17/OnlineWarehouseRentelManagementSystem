using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCancellationTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add CancellationFee column to rental_contracts
            migrationBuilder.AddColumn<decimal>(
                name: "CancellationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true);

            // Add EarlyTerminationFee column to rental_contracts
            migrationBuilder.AddColumn<decimal>(
                name: "EarlyTerminationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true);

            // Create cancellation_logs table
            migrationBuilder.CreateTable(
                name: "cancellation_logs",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    rental_request_id = table.Column<int>(type: "int", nullable: true),
                    rental_contract_id = table.Column<int>(type: "int", nullable: true),
                    cancelled_stage = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    cancelled_by = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    cancellation_reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    refund_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    cancellation_fee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cancellation_logs", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_cancellation_logs_rental_requests",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "request_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cancellation_logs_rental_contracts",
                        column: x => x.rental_contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create refunds table
            migrationBuilder.CreateTable(
                name: "refunds",
                columns: table => new
                {
                    refund_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    payment_id = table.Column<int>(type: "int", nullable: true),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    reason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    processed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refunds", x => x.refund_id);
                    table.ForeignKey(
                        name: "FK_refunds_rental_payments",
                        column: x => x.payment_id,
                        principalTable: "rental_payments",
                        principalColumn: "payment_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_refunds_rental_contracts",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create indexes for cancellation_logs
            migrationBuilder.CreateIndex(
                name: "IX_cancellation_logs_rental_request_id",
                table: "cancellation_logs",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_logs_rental_contract_id",
                table: "cancellation_logs",
                column: "rental_contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_logs_created_at",
                table: "cancellation_logs",
                column: "created_at");

            // Create indexes for refunds
            migrationBuilder.CreateIndex(
                name: "IX_refunds_payment_id",
                table: "refunds",
                column: "payment_id");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_contract_id",
                table: "refunds",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_status",
                table: "refunds",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_created_at",
                table: "refunds",
                column: "created_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "refunds");
            migrationBuilder.DropTable(name: "cancellation_logs");

            migrationBuilder.DropColumn(name: "EarlyTerminationFee", table: "rental_contracts");
            migrationBuilder.DropColumn(name: "CancellationFee", table: "rental_contracts");
        }
    }
}
