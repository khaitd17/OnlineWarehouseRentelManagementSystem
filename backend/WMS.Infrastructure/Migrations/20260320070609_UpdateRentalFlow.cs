using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRentalFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "rental_contracts",
                columns: table => new
                {
                    contract_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    rental_request_id = table.Column<int>(type: "int", nullable: false),
                    contract_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    start_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    end_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    monthly_payment = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    total_value = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    terms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    contract_file_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    signed_file_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    signed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    owner_signed_file_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    owner_signed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    owner_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    cancellation_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    otp_attempts = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    is_signing_locked = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    signing_locked_until = table.Column<DateTime>(type: "datetime2", nullable: true),
                    pending_signature_expiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    pending_payment_expiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    parent_contract_id = table.Column<int>(type: "int", nullable: true),
                    early_termination_fee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    damage_compensation = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    returned_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    return_notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_contracts", x => x.contract_id);
                    table.ForeignKey(
                        name: "FK_rental_contracts_parent",
                        column: x => x.parent_contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_rental_contracts_request",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "request_id");
                    table.ForeignKey(
                        name: "FK_rental_contracts_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "contract_extensions",
                columns: table => new
                {
                    extension_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    original_contract_id = table.Column<int>(type: "int", nullable: false),
                    new_contract_id = table.Column<int>(type: "int", nullable: true),
                    requester_id = table.Column<int>(type: "int", nullable: false),
                    duration_months = table.Column<int>(type: "int", nullable: false),
                    proposed_monthly_payment = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    requested_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    reviewed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    reviewed_by = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_extensions", x => x.extension_id);
                    table.ForeignKey(
                        name: "FK_contract_extensions_new",
                        column: x => x.new_contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_extensions_original",
                        column: x => x.original_contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_extensions_requester",
                        column: x => x.requester_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_contract_extensions_reviewer",
                        column: x => x.reviewed_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "rental_payments",
                columns: table => new
                {
                    payment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    payment_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    payment_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    sepay_transaction_id = table.Column<int>(type: "int", nullable: true),
                    sepay_reference_code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    paid_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    expired_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_payments", x => x.payment_id);
                    table.ForeignKey(
                        name: "FK_rental_payments_contract",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id");
                });

            migrationBuilder.CreateTable(
                name: "warehouse_returns",
                columns: table => new
                {
                    return_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    inspector_id = table.Column<int>(type: "int", nullable: true),
                    inspection_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    is_clean = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    is_equipment_intact = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    is_no_outstanding_debt = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    damage_fee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    penalty_fee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_returns", x => x.return_id);
                    table.ForeignKey(
                        name: "FK_warehouse_returns_contract",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_warehouse_returns_inspector",
                        column: x => x.inspector_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "return_images",
                columns: table => new
                {
                    image_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    return_id = table.Column<int>(type: "int", nullable: false),
                    image_url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_return_images", x => x.image_id);
                    table.ForeignKey(
                        name: "FK_return_images_return",
                        column: x => x.return_id,
                        principalTable: "warehouse_returns",
                        principalColumn: "return_id");
                });

            migrationBuilder.CreateIndex(
                name: "idx_ce_original_contract",
                table: "contract_extensions",
                column: "original_contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_ce_status",
                table: "contract_extensions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_contract_extensions_new_contract_id",
                table: "contract_extensions",
                column: "new_contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_extensions_requester_id",
                table: "contract_extensions",
                column: "requester_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_extensions_reviewed_by",
                table: "contract_extensions",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "idx_rc_contract_number",
                table: "rental_contracts",
                column: "contract_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_rc_renter",
                table: "rental_contracts",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "idx_rc_status",
                table: "rental_contracts",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_rc_warehouse",
                table: "rental_contracts",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_contracts_parent_contract_id",
                table: "rental_contracts",
                column: "parent_contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_contracts_rental_request_id",
                table: "rental_contracts",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "idx_rp_contract",
                table: "rental_payments",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_rp_payment_code",
                table: "rental_payments",
                column: "payment_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_rp_status",
                table: "rental_payments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_ri_return",
                table: "return_images",
                column: "return_id");

            migrationBuilder.CreateIndex(
                name: "idx_wr_contract",
                table: "warehouse_returns",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_wr_status",
                table: "warehouse_returns",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_returns_inspector_id",
                table: "warehouse_returns",
                column: "inspector_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contract_extensions");

            migrationBuilder.DropTable(
                name: "rental_payments");

            migrationBuilder.DropTable(
                name: "return_images");

            migrationBuilder.DropTable(
                name: "warehouse_returns");

            migrationBuilder.DropTable(
                name: "rental_contracts");
        }
    }
}
