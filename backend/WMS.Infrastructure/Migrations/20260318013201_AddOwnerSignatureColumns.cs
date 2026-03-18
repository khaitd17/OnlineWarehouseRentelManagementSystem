using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerSignatureColumns : Migration
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
                defaultValue: "PENDING_OWNER_SIGNATURE",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true,
                oldDefaultValue: "ACTIVE");

            migrationBuilder.AddColumn<string>(
                name: "owner_signature_base64",
                table: "contracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "owner_signed_at",
                table: "contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "owner_signed_file_url",
                table: "contracts",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "owner_signature_base64",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "owner_signed_at",
                table: "contracts");

            migrationBuilder.DropColumn(
                name: "owner_signed_file_url",
                table: "contracts");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "contracts",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "ACTIVE",
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true,
                oldDefaultValue: "PENDING_OWNER_SIGNATURE");
        }
    }
}
