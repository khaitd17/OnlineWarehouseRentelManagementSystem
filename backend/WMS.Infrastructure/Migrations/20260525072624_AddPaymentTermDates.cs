using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentTermDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MapTotalArea",
                table: "warehouses");

            migrationBuilder.AddColumn<DateTime>(
                name: "TermEndDate",
                table: "rental_payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TermStartDate",
                table: "rental_payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "session_type",
                table: "ai_analysis_sessions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "IMAGE_ANALYSIS");

            migrationBuilder.AddColumn<string>(
                name: "user_prompt",
                table: "ai_analysis_sessions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TermEndDate",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "TermStartDate",
                table: "rental_payments");

            migrationBuilder.DropColumn(
                name: "session_type",
                table: "ai_analysis_sessions");

            migrationBuilder.DropColumn(
                name: "user_prompt",
                table: "ai_analysis_sessions");

            migrationBuilder.AddColumn<double>(
                name: "MapTotalArea",
                table: "warehouses",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
