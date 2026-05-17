using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMapTotalArea : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "MapTotalArea",
                table: "warehouses",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "proof_note",
                table: "rental_payments",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "proof_request_reason",
                table: "rental_payments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "proof_requested_at",
                table: "rental_payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "proof_submitted_at",
                table: "rental_payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "proof_url",
                table: "rental_payments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "transaction_code",
                table: "rental_payments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "receipt_notes",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "DRAFT",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "DRAFT");

            migrationBuilder.AddColumn<decimal>(
                name: "capacity_overflow",
                table: "receipt_notes",
                type: "decimal(10,3)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentTerms_contracts_ContractId",
                table: "PaymentTerms",
                column: "ContractId",
                principalTable: "contracts",
                principalColumn: "contract_id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentTerms_contracts_ContractId",
                table: "PaymentTerms");

            migrationBuilder.DropColumn(
                name: "MapTotalArea",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "proof_note",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "proof_request_reason",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "proof_requested_at",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "proof_submitted_at",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "proof_url",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "transaction_code",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "capacity_overflow",
                table: "receipt_notes");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "receipt_notes",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "DRAFT",
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldDefaultValue: "DRAFT");
        }
    }
}
