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
            // Thêm cột pending_change_note nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'warehouses' AND COLUMN_NAME = 'pending_change_note'
                )
                BEGIN
                    ALTER TABLE [warehouses] ADD [pending_change_note] nvarchar(500) NULL;
                END
            ");

            // Thêm cột submission_type nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'warehouses' AND COLUMN_NAME = 'submission_type'
                )
                BEGIN
                    ALTER TABLE [warehouses] ADD [submission_type] nvarchar(20) NOT NULL DEFAULT 'NEW';
                END
            ");
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
