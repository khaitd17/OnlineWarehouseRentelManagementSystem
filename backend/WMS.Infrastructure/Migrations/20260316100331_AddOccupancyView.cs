using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOccupancyView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE VIEW v_warehouse_occupancy AS
                SELECT 
                    w.warehouse_id,
                    w.name,
                    w.total_area,
                    w.available_area,
                    ISNULL(SUM(rr.requested_area), 0) AS occupied_area,
                    CASE 
                        WHEN w.total_area > 0 THEN (ISNULL(SUM(rr.requested_area), 0) / w.total_area) * 100 
                        ELSE 0 
                    END AS occupancy_rate
                FROM warehouses w
                LEFT JOIN rental_requests rr ON w.warehouse_id = rr.warehouse_id AND rr.status = 'APPROVED'
                GROUP BY w.warehouse_id, w.name, w.total_area, w.available_area
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW v_warehouse_occupancy");
        }
    }
}
