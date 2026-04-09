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
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'equipment_incidents')
                BEGIN
                    CREATE TABLE [equipment_incidents] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [EquipmentId] int NOT NULL,
                        [WarehouseId] int NOT NULL,
                        [ReportedById] int NOT NULL,
                        [Title] nvarchar(255) NOT NULL,
                        [Description] nvarchar(max) NOT NULL,
                        [Severity] nvarchar(20) NOT NULL,
                        [Status] nvarchar(20) NOT NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT (getdate()),
                        [UpdatedAt] datetime2 NULL,
                        [ResolvedAt] datetime2 NULL,
                        CONSTRAINT [PK_equipment_incidents] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_equipment_incidents_equipments_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [equipments] ([equipment_id]),
                        CONSTRAINT [FK_equipment_incidents_users_ReportedById] FOREIGN KEY ([ReportedById]) REFERENCES [users] ([user_id]),
                        CONSTRAINT [FK_equipment_incidents_warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [warehouses] ([warehouse_id])
                    );
                    CREATE INDEX [IX_equipment_incidents_EquipmentId] ON [equipment_incidents] ([EquipmentId]);
                    CREATE INDEX [IX_equipment_incidents_ReportedById] ON [equipment_incidents] ([ReportedById]);
                    CREATE INDEX [IX_equipment_incidents_WarehouseId] ON [equipment_incidents] ([WarehouseId]);
                END

                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'equipment_incident_attachments')
                BEGIN
                    CREATE TABLE [equipment_incident_attachments] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [IncidentId] int NOT NULL,
                        [FileUrl] nvarchar(max) NOT NULL,
                        [FileType] nvarchar(max) NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT (getdate()),
                        CONSTRAINT [PK_equipment_incident_attachments] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_equipment_incident_attachments_equipment_incidents_IncidentId] FOREIGN KEY ([IncidentId]) REFERENCES [equipment_incidents] ([Id])
                    );
                    CREATE INDEX [IX_equipment_incident_attachments_IncidentId] ON [equipment_incident_attachments] ([IncidentId]);
                END

                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'equipment_incident_comments')
                BEGIN
                    CREATE TABLE [equipment_incident_comments] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [IncidentId] int NOT NULL,
                        [UserId] int NOT NULL,
                        [Content] nvarchar(max) NOT NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT (getdate()),
                        CONSTRAINT [PK_equipment_incident_comments] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_equipment_incident_comments_equipment_incidents_IncidentId] FOREIGN KEY ([IncidentId]) REFERENCES [equipment_incidents] ([Id]),
                        CONSTRAINT [FK_equipment_incident_comments_users_UserId] FOREIGN KEY ([UserId]) REFERENCES [users] ([user_id])
                    );
                    CREATE INDEX [IX_equipment_incident_comments_IncidentId] ON [equipment_incident_comments] ([IncidentId]);
                    CREATE INDEX [IX_equipment_incident_comments_UserId] ON [equipment_incident_comments] ([UserId]);
                END
            ");
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
