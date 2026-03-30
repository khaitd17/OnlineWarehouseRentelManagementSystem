using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentIncidents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "equipment_incidents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EquipmentId = table.Column<int>(type: "int", nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    ReportedById = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_incidents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_equipment_incidents_equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipments",
                        principalColumn: "equipment_id");
                    table.ForeignKey(
                        name: "FK_equipment_incidents_users_ReportedById",
                        column: x => x.ReportedById,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_equipment_incidents_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "equipment_incident_attachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IncidentId = table.Column<int>(type: "int", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_incident_attachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_equipment_incident_attachments_equipment_incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "equipment_incidents",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "equipment_incident_comments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IncidentId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_incident_comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_equipment_incident_comments_equipment_incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "equipment_incidents",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_equipment_incident_comments_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_equipment_incident_attachments_IncidentId",
                table: "equipment_incident_attachments",
                column: "IncidentId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_incident_comments_IncidentId",
                table: "equipment_incident_comments",
                column: "IncidentId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_incident_comments_UserId",
                table: "equipment_incident_comments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_incidents_EquipmentId",
                table: "equipment_incidents",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_incidents_ReportedById",
                table: "equipment_incidents",
                column: "ReportedById");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_incidents_WarehouseId",
                table: "equipment_incidents",
                column: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "equipment_incident_attachments");

            migrationBuilder.DropTable(
                name: "equipment_incident_comments");

            migrationBuilder.DropTable(
                name: "equipment_incidents");
        }
    }
}
