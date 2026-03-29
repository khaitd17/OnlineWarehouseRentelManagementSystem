using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseSubmissionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Bỏ qua do rác từ Model Snapshot, DB không thực sự có constraint/cột này
            // migrationBuilder.DropForeignKey("FK_equipment_histories_rental_contracts_RentalContractContractId", "equipment_histories");
            // migrationBuilder.DropForeignKey("FK_equipments_rental_contracts_RentalContractContractId", "equipments");
            // migrationBuilder.DropIndex("IX_equipments_RentalContractContractId", "equipments");
            // migrationBuilder.DropIndex("IX_equipment_histories_RentalContractContractId", "equipment_histories");
            // migrationBuilder.DropColumn("RentalContractContractId", "equipments");
            // migrationBuilder.DropColumn("RentalContractContractId", "equipment_histories");

            migrationBuilder.AddColumn<string>(
                name: "pending_change_note",
                table: "warehouses",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "submission_type",
                table: "warehouses",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "NEW");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "pending_change_note",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "submission_type",
                table: "warehouses");

            migrationBuilder.AddColumn<int>(
                name: "RentalContractContractId",
                table: "equipments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RentalContractContractId",
                table: "equipment_histories",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_equipments_RentalContractContractId",
                table: "equipments",
                column: "RentalContractContractId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_histories_RentalContractContractId",
                table: "equipment_histories",
                column: "RentalContractContractId");

            migrationBuilder.AddForeignKey(
                name: "FK_equipment_histories_rental_contracts_RentalContractContractId",
                table: "equipment_histories",
                column: "RentalContractContractId",
                principalTable: "rental_contracts",
                principalColumn: "contract_id");

            migrationBuilder.AddForeignKey(
                name: "FK_equipments_rental_contracts_RentalContractContractId",
                table: "equipments",
                column: "RentalContractContractId",
                principalTable: "rental_contracts",
                principalColumn: "contract_id");
        }
    }
}
