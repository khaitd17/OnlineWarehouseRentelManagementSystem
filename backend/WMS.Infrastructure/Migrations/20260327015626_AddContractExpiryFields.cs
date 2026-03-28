using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContractExpiryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OwnerSignatureExpiry",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentExpiry",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RenterSignatureExpiry",
                table: "rental_contracts",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerSignatureExpiry",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "PaymentExpiry",
                table: "rental_contracts");

            migrationBuilder.DropColumn(
                name: "RenterSignatureExpiry",
                table: "rental_contracts");
        }
    }
}
