using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContractTerminationApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add missing termination approval columns to 'contracts' table
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'termination_requested_by') ALTER TABLE contracts ADD termination_requested_by nvarchar(20) NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'termination_requested_at') ALTER TABLE contracts ADD termination_requested_at datetime2 NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'renter_approved_termination') ALTER TABLE contracts ADD renter_approved_termination bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'owner_approved_termination') ALTER TABLE contracts ADD owner_approved_termination bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'early_termination_fee') ALTER TABLE contracts ADD early_termination_fee decimal(15,2) NULL;");

            // Add missing columns to 'rental_contracts' table
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'EarlyTerminationFee') ALTER TABLE rental_contracts ADD EarlyTerminationFee decimal(15,2) NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'OwnerApprovedTermination') ALTER TABLE rental_contracts ADD OwnerApprovedTermination bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'RenterApprovedTermination') ALTER TABLE rental_contracts ADD RenterApprovedTermination bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'TerminationRequestedAt') ALTER TABLE rental_contracts ADD TerminationRequestedAt datetime2 NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'TerminationRequestedBy') ALTER TABLE rental_contracts ADD TerminationRequestedBy nvarchar(20) NULL;");

            // Add other missing columns on rental_contracts
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'owner_signature_expiry') ALTER TABLE rental_contracts ADD owner_signature_expiry datetime2 NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'RenterSignatureExpiry') ALTER TABLE rental_contracts ADD RenterSignatureExpiry datetime2 NULL;");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'PaymentExpiry') ALTER TABLE rental_contracts ADD PaymentExpiry datetime2 NULL;");

            // Add payment_method to rental_payments if missing
            migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_payments') AND name = 'payment_method') ALTER TABLE rental_payments ADD payment_method nvarchar(20) NOT NULL DEFAULT 'BANK_TRANSFER';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Down is intentionally empty - removing columns manually if needed
        }
    }
}
