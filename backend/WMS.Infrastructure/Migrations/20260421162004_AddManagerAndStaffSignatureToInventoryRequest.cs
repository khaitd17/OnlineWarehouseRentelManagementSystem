using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddManagerAndStaffSignatureToInventoryRequest : Migration
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
