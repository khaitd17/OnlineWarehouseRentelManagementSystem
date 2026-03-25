using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffShifts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Length",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "MainDoorDirection",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "warehouses");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "warehouse_returns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WarehouseShiftId",
                table: "warehouse_memberships",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentUrls",
                table: "inventory_requests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StaffShifts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MembershipId = table.Column<int>(type: "int", nullable: false),
                    ShiftDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TimeIn1 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TimeOut1 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TimeIn2 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TimeOut2 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShiftType = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffShifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffShifts_warehouse_memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "warehouse_memberships",
                        principalColumn: "membership_id");
                });

            migrationBuilder.CreateTable(
                name: "WarehouseShifts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EndTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarehouseShifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WarehouseShifts_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_memberships_WarehouseShiftId",
                table: "warehouse_memberships",
                column: "WarehouseShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffShifts_MembershipId",
                table: "StaffShifts",
                column: "MembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseShifts_WarehouseId",
                table: "WarehouseShifts",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_warehouse_memberships_WarehouseShifts_WarehouseShiftId",
                table: "warehouse_memberships",
                column: "WarehouseShiftId",
                principalTable: "WarehouseShifts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_warehouse_memberships_WarehouseShifts_WarehouseShiftId",
                table: "warehouse_memberships");

            migrationBuilder.DropTable(
                name: "StaffShifts");

            migrationBuilder.DropTable(
                name: "WarehouseShifts");

            migrationBuilder.DropIndex(
                name: "IX_warehouse_memberships_WarehouseShiftId",
                table: "warehouse_memberships");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "warehouse_returns");

            migrationBuilder.DropColumn(
                name: "WarehouseShiftId",
                table: "warehouse_memberships");

            migrationBuilder.DropColumn(
                name: "DocumentUrls",
                table: "inventory_requests");

            migrationBuilder.AddColumn<double>(
                name: "Length",
                table: "warehouses",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MainDoorDirection",
                table: "warehouses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Width",
                table: "warehouses",
                type: "float",
                nullable: true);
        }
    }
}
