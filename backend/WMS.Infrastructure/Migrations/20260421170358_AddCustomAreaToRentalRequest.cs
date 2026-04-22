using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomAreaToRentalRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('inventory_requests') AND name = 'manager_signature_base64')
                    ALTER TABLE [inventory_requests] ADD [manager_signature_base64] nvarchar(max) NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('inventory_requests') AND name = 'staff_signature_base64')
                    ALTER TABLE [inventory_requests] ADD [staff_signature_base64] nvarchar(max) NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[notifications]') AND type = 'U')
                BEGIN
                    CREATE TABLE [notifications] (
                        [notification_id] int NOT NULL IDENTITY,
                        [user_id] int NOT NULL,
                        [title] nvarchar(255) NOT NULL,
                        [message] nvarchar(max) NOT NULL,
                        [type] nvarchar(50) NOT NULL,
                        [reference_id] int NULL,
                        [reference_type] nvarchar(50) NULL,
                        [is_read] bit NOT NULL DEFAULT 0,
                        [created_at] datetime2 NULL DEFAULT (getdate()),
                        CONSTRAINT [PK_notifications] PRIMARY KEY ([notification_id]),
                        CONSTRAINT [FK_notifications_user] FOREIGN KEY ([user_id]) REFERENCES [users] ([user_id])
                    );
                    CREATE INDEX [idx_notifications_created_at] ON [notifications] ([created_at]);
                    CREATE INDEX [idx_notifications_is_read] ON [notifications] ([is_read]);
                    CREATE INDEX [idx_notifications_user] ON [notifications] ([user_id]);
                END
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'is_custom_area')
                    ALTER TABLE [rental_requests] ADD [is_custom_area] bit NOT NULL DEFAULT 0;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_position_x')
                    ALTER TABLE [rental_requests] ADD [proposed_position_x] float NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_position_y')
                    ALTER TABLE [rental_requests] ADD [proposed_position_y] float NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_width')
                    ALTER TABLE [rental_requests] ADD [proposed_width] float NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_length')
                    ALTER TABLE [rental_requests] ADD [proposed_length] float NULL;
            ");
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'base_rental_area_id')
                    ALTER TABLE [rental_requests] ADD [base_rental_area_id] int NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('inventory_requests') AND name = 'manager_signature_base64')
                    ALTER TABLE [inventory_requests] DROP COLUMN [manager_signature_base64];
            ");
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('inventory_requests') AND name = 'staff_signature_base64')
                    ALTER TABLE [inventory_requests] DROP COLUMN [staff_signature_base64];
            ");
        }
    }
}
