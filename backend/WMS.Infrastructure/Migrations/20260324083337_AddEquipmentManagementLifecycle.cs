using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentManagementLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RentalAreaId",
                table: "rental_requests",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "equipments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "AVAILABLE",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true,
                oldDefaultValue: "ACTIVE");

            migrationBuilder.AddColumn<int>(
                name: "maintenance_cycle_days",
                table: "equipments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "note",
                table: "equipments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "rental_area_id",
                table: "equipments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "serial_number",
                table: "equipments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "equipment_histories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EquipmentId = table.Column<int>(type: "int", nullable: false),
                    PreviousStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PreviousRentalAreaId = table.Column<int>(type: "int", nullable: true),
                    NewRentalAreaId = table.Column<int>(type: "int", nullable: true),
                    ContractId = table.Column<int>(type: "int", nullable: true),
                    ChangedBy = table.Column<int>(type: "int", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_histories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_equipment_histories_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_equipment_histories_equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipments",
                        principalColumn: "equipment_id");
                });

            migrationBuilder.CreateTable(
                name: "equipment_maintenance_records",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EquipmentId = table.Column<int>(type: "int", nullable: false),
                    MaintenanceDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MaintenanceType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalCost = table.Column<decimal>(type: "decimal(15,2)", nullable: true),
                    PerformedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResolutionStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_maintenance_records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_equipment_maintenance_records_equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipments",
                        principalColumn: "equipment_id");
                });

            migrationBuilder.CreateTable(
                name: "rental_contract_equipments",
                columns: table => new
                {
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    equipment_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_contract_equipments", x => new { x.contract_id, x.equipment_id });
                    table.ForeignKey(
                        name: "FK_rental_contract_equipments_contracts_contract_id",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_rental_contract_equipments_equipments_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "equipments",
                        principalColumn: "equipment_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_rental_requests_RentalAreaId",
                table: "rental_requests",
                column: "RentalAreaId");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_area",
                table: "equipments",
                column: "rental_area_id");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_histories_ContractId",
                table: "equipment_histories",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_histories_EquipmentId",
                table: "equipment_histories",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_maintenance_records_EquipmentId",
                table: "equipment_maintenance_records",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_rental_contract_equipments_equipment_id",
                table: "rental_contract_equipments",
                column: "equipment_id");

            migrationBuilder.AddForeignKey(
                name: "FK_equipments_rental_area",
                table: "equipments",
                column: "rental_area_id",
                principalTable: "rental_areas",
                principalColumn: "rental_area_id");

            migrationBuilder.AddForeignKey(
                name: "FK_rental_requests_rental_areas_RentalAreaId",
                table: "rental_requests",
                column: "RentalAreaId",
                principalTable: "rental_areas",
                principalColumn: "rental_area_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_equipments_rental_area",
                table: "equipments");

            migrationBuilder.DropForeignKey(
                name: "FK_rental_requests_rental_areas_RentalAreaId",
                table: "rental_requests");

            migrationBuilder.DropTable(
                name: "equipment_histories");

            migrationBuilder.DropTable(
                name: "equipment_maintenance_records");

            migrationBuilder.DropTable(
                name: "rental_contract_equipments");

            migrationBuilder.DropIndex(
                name: "IX_rental_requests_RentalAreaId",
                table: "rental_requests");

            migrationBuilder.DropIndex(
                name: "idx_equipments_area",
                table: "equipments");

            migrationBuilder.DropColumn(
                name: "RentalAreaId",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "maintenance_cycle_days",
                table: "equipments");

            migrationBuilder.DropColumn(
                name: "note",
                table: "equipments");

            migrationBuilder.DropColumn(
                name: "rental_area_id",
                table: "equipments");

            migrationBuilder.DropColumn(
                name: "serial_number",
                table: "equipments");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "equipments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "ACTIVE",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true,
                oldDefaultValue: "AVAILABLE");
        }
    }
}
