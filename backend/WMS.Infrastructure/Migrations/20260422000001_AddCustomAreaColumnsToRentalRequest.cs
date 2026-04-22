using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WMS.Infrastructure.Persistence;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260422000001_AddCustomAreaColumnsToRentalRequest")]
    public partial class AddCustomAreaColumnsToRentalRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'is_custom_area')
                    ALTER TABLE [rental_requests] DROP COLUMN [is_custom_area];
            ");
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_position_x')
                    ALTER TABLE [rental_requests] DROP COLUMN [proposed_position_x];
            ");
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_position_y')
                    ALTER TABLE [rental_requests] DROP COLUMN [proposed_position_y];
            ");
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_width')
                    ALTER TABLE [rental_requests] DROP COLUMN [proposed_width];
            ");
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'proposed_length')
                    ALTER TABLE [rental_requests] DROP COLUMN [proposed_length];
            ");
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rental_requests') AND name = 'base_rental_area_id')
                    ALTER TABLE [rental_requests] DROP COLUMN [base_rental_area_id];
            ");
        }
    }
}
