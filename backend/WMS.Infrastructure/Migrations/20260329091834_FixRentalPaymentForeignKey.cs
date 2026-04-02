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
            // FIX: Drop old FK if exists, add new FK if not exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_rental_payments_contract')
                    ALTER TABLE [rental_payments] DROP CONSTRAINT [FK_rental_payments_contract];

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_rental_payments_contracts')
                    ALTER TABLE [rental_payments] ADD CONSTRAINT [FK_rental_payments_contracts] FOREIGN KEY ([contract_id]) REFERENCES [contracts] ([contract_id]) ON DELETE CASCADE;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_payments') AND name = 'payment_method')
                    ALTER TABLE rental_payments ADD payment_method NVARCHAR(20) NOT NULL DEFAULT 'BANK_TRANSFER';

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('warehouses') AND name = 'submission_type')
                    ALTER TABLE warehouses ADD submission_type NVARCHAR(20) NOT NULL DEFAULT 'NEW';

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('warehouses') AND name = 'pending_change_note')
                    ALTER TABLE warehouses ADD pending_change_note NVARCHAR(500) NULL;

                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'OwnerSignatureExpiry')
                    EXEC sp_rename 'rental_contracts.OwnerSignatureExpiry', 'owner_signature_expiry', 'COLUMN';
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
