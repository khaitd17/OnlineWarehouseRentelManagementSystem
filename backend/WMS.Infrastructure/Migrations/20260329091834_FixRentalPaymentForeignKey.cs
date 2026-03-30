using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixRentalPaymentForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // FIX: Drop old FK that points to rental_contracts table
            migrationBuilder.DropForeignKey(
                name: "FK_rental_payments_contract",
                table: "rental_payments");

            // FIX: Add new FK that points to contracts table (where contracts are actually stored)
            migrationBuilder.AddForeignKey(
                name: "FK_rental_payments_contracts",
                table: "rental_payments",
                column: "contract_id",
                principalTable: "contracts",
                principalColumn: "contract_id",
                onDelete: ReferentialAction.Cascade);

            // Add payment_method column if not exists
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_payments') AND name = 'payment_method')
                BEGIN
                    ALTER TABLE rental_payments ADD payment_method NVARCHAR(20) NOT NULL DEFAULT 'BANK_TRANSFER'
                END
            ");

            // Add submission_type column if not exists
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('warehouses') AND name = 'submission_type')
                BEGIN
                    ALTER TABLE warehouses ADD submission_type NVARCHAR(20) NOT NULL DEFAULT 'NEW'
                END
            ");

            // Add pending_change_note column if not exists
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('warehouses') AND name = 'pending_change_note')
                BEGIN
                    ALTER TABLE warehouses ADD pending_change_note NVARCHAR(500) NULL
                END
            ");

            // Rename OwnerSignatureExpiry to owner_signature_expiry if needed
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'OwnerSignatureExpiry')
                BEGIN
                    EXEC sp_rename 'rental_contracts.OwnerSignatureExpiry', 'owner_signature_expiry', 'COLUMN'
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert: Drop new FK
            migrationBuilder.DropForeignKey(
                name: "FK_rental_payments_contracts",
                table: "rental_payments");

            // Revert: Restore old FK to rental_contracts
            migrationBuilder.AddForeignKey(
                name: "FK_rental_payments_contract",
                table: "rental_payments",
                column: "contract_id",
                principalTable: "rental_contracts",
                principalColumn: "contract_id");

            migrationBuilder.DropColumn(
                name: "pending_change_note",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "submission_type",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "payment_method",
                table: "rental_payments");

            migrationBuilder.RenameColumn(
                name: "owner_signature_expiry",
                table: "rental_contracts",
                newName: "OwnerSignatureExpiry");
        }
    }
}
