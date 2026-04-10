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
            migrationBuilder.DropForeignKey(
                name: "FK_contract_extensions_rental_contracts_new_contract_id",
                table: "contract_extensions");

            migrationBuilder.DropForeignKey(
                name: "FK_contract_extensions_rental_contracts_original_contract_id",
                table: "contract_extensions");

            migrationBuilder.DropForeignKey(
                name: "FK_rental_payments_rental_contracts_contract_id",
                table: "rental_payments");

            migrationBuilder.DropTable(
                name: "ContractEquipment");

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "rental_requests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "rental_requests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "rental_requests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastRetryAt",
                table: "rental_payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxRetry",
                table: "rental_payments",
                type: "int",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "RetryCount",
                table: "rental_payments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "payment_method",
                table: "rental_payments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "BANK_TRANSFER");

            migrationBuilder.AddColumn<decimal>(
                name: "CancellationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "rental_contracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EarlyTerminationFee",
                table: "rental_contracts",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GracePeriodHours",
                table: "rental_contracts",
                type: "int",
                nullable: false,
                defaultValue: 24);

            migrationBuilder.AddColumn<bool>(
                name: "OwnerApprovedTermination",
                table: "rental_contracts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentExpiry",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RenterApprovedTermination",
                table: "rental_contracts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "RenterSignatureExpiry",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TerminationRequestedAt",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TerminationRequestedBy",
                table: "rental_contracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "owner_signature_expiry",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "early_termination_fee",
                table: "contracts",
                type: "decimal(15,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "owner_approved_termination",
                table: "contracts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "renter_approved_termination",
                table: "contracts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "termination_requested_at",
                table: "contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "termination_requested_by",
                table: "contracts",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_contract_extensions_contracts_new_contract_id",
                table: "contract_extensions",
                column: "new_contract_id",
                principalTable: "contracts",
                principalColumn: "contract_id");

            migrationBuilder.AddForeignKey(
                name: "FK_contract_extensions_contracts_original_contract_id",
                table: "contract_extensions",
                column: "original_contract_id",
                principalTable: "contracts",
                principalColumn: "contract_id");

            migrationBuilder.AddForeignKey(
                name: "FK_rental_payments_contracts",
                table: "rental_payments",
                column: "contract_id",
                principalTable: "contracts",
                principalColumn: "contract_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_contract_extensions_contracts_new_contract_id",
                table: "contract_extensions");

            migrationBuilder.DropForeignKey(
                name: "FK_contract_extensions_contracts_original_contract_id",
                table: "contract_extensions");

            migrationBuilder.DropForeignKey(
                name: "FK_rental_payments_contracts",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "LastRetryAt",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "MaxRetry",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "RetryCount",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "payment_method",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "CancellationFee",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "EarlyTerminationFee",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "GracePeriodHours",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "OwnerApprovedTermination",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "PaymentExpiry",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "RenterApprovedTermination",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "RenterSignatureExpiry",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "TerminationRequestedAt",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "TerminationRequestedBy",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "owner_signature_expiry",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "early_termination_fee",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "owner_approved_termination",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "renter_approved_termination",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "termination_requested_at",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "termination_requested_by",
                table: "contracts");

            migrationBuilder.CreateTable(
                name: "ContractEquipment",
                columns: table => new
                {
                    IncludedEquipmentsEquipmentId = table.Column<int>(type: "int", nullable: false),
                    RentalContractsContractId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractEquipment", x => new { x.IncludedEquipmentsEquipmentId, x.RentalContractsContractId });
                    table.ForeignKey(
                        name: "FK_ContractEquipment_contracts_RentalContractsContractId",
                        column: x => x.RentalContractsContractId,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_ContractEquipment_equipments_IncludedEquipmentsEquipmentId",
                        column: x => x.IncludedEquipmentsEquipmentId,
                        principalTable: "equipments",
                        principalColumn: "equipment_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractEquipment_RentalContractsContractId",
                table: "ContractEquipment",
                column: "RentalContractsContractId");

            migrationBuilder.AddForeignKey(
                name: "FK_contract_extensions_rental_contracts_new_contract_id",
                table: "contract_extensions",
                column: "new_contract_id",
                principalTable: "rental_contracts",
                principalColumn: "contract_id");

            migrationBuilder.AddForeignKey(
                name: "FK_contract_extensions_rental_contracts_original_contract_id",
                table: "contract_extensions",
                column: "original_contract_id",
                principalTable: "rental_contracts",
                principalColumn: "contract_id");

            migrationBuilder.AddForeignKey(
                name: "FK_rental_payments_rental_contracts_contract_id",
                table: "rental_payments",
                column: "contract_id",
                principalTable: "rental_contracts",
                principalColumn: "contract_id");
        }
    }
}
