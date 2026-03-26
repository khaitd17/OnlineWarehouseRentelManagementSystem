using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerReplyToRating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "owner_reply",
                table: "ratings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "replied_at",
                table: "ratings",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "owner_reply",
                table: "ratings");

            migrationBuilder.DropColumn(
                name: "replied_at",
                table: "ratings");
        }
    }
}
