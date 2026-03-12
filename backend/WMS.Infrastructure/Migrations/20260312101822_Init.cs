using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    role_name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__roles__760965CC39FDE095", x => x.role_id);
                });

            migrationBuilder.CreateTable(
                name: "skills",
                columns: table => new
                {
                    skill_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_skills", x => x.skill_id);
                });

            migrationBuilder.CreateTable(
                name: "task_types",
                columns: table => new
                {
                    task_type_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_types", x => x.task_type_id);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_roles",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_roles", x => x.role_id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    role_id = table.Column<int>(type: "int", nullable: false),
                    full_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    password_hash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    avatar_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "PENDING"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    last_login_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__users__B9BE370FD71B3418", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_users_roles",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "role_id");
                });

            migrationBuilder.CreateTable(
                name: "task_type_skills",
                columns: table => new
                {
                    task_type_id = table.Column<int>(type: "int", nullable: false),
                    skill_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_type_skills", x => new { x.task_type_id, x.skill_id });
                    table.ForeignKey(
                        name: "FK_task_type_skills_skills_skill_id",
                        column: x => x.skill_id,
                        principalTable: "skills",
                        principalColumn: "skill_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_task_type_skills_task_types_task_type_id",
                        column: x => x.task_type_id,
                        principalTable: "task_types",
                        principalColumn: "task_type_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    token_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    token = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    is_used = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__password_reset_tokens", x => x.token_id);
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_user",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouses",
                columns: table => new
                {
                    warehouse_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    owner_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    lat = table.Column<double>(type: "float", nullable: true),
                    lng = table.Column<double>(type: "float", nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    total_area = table.Column<double>(type: "float", nullable: false),
                    available_area = table.Column<double>(type: "float", nullable: false),
                    operating_hours = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "PENDING"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    approved_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    approved_by = table.Column<int>(type: "int", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__warehous__734FE6BFFBD35973", x => x.warehouse_id);
                    table.ForeignKey(
                        name: "FK_warehouses_approver",
                        column: x => x.approved_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_warehouses_owner",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_sessions",
                columns: table => new
                {
                    audit_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "OPEN"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__audit_se__5AF33E337F6DAD00", x => x.audit_id);
                    table.ForeignKey(
                        name: "FK_audit_sessions_creator",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_audit_sessions_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "equipments",
                columns: table => new
                {
                    equipment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    specifications = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "ACTIVE"),
                    iot_device_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    purchase_date = table.Column<DateOnly>(type: "date", nullable: true),
                    last_maintenance_date = table.Column<DateOnly>(type: "date", nullable: true),
                    next_maintenance_date = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__equipmen__197068AFB451FEC1", x => x.equipment_id);
                    table.ForeignKey(
                        name: "FK_equipments_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inventory_requests",
                columns: table => new
                {
                    inv_req_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "PENDING"),
                    confirmed_by = table.Column<int>(type: "int", nullable: true),
                    confirmed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__inventor__A56BE5DEA2C9FF70", x => x.inv_req_id);
                    table.ForeignKey(
                        name: "FK_inventory_requests_confirmer",
                        column: x => x.confirmed_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_inventory_requests_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_inventory_requests_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "rental_requests",
                columns: table => new
                {
                    request_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    requested_area = table.Column<double>(type: "float", nullable: false),
                    start_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    duration_months = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    reviewed_by = table.Column<int>(type: "int", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    contract_image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__rental_r__18D3B90F92B6C93A", x => x.request_id);
                    table.ForeignKey(
                        name: "FK_rental_requests_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_rental_requests_reviewer",
                        column: x => x.reviewed_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_rental_requests_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "tasks",
                columns: table => new
                {
                    task_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    task_type_id = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasks", x => x.task_id);
                    table.ForeignKey(
                        name: "FK_tasks_task_types_task_type_id",
                        column: x => x.task_type_id,
                        principalTable: "task_types",
                        principalColumn: "task_type_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tasks_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_documents",
                columns: table => new
                {
                    document_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    document_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    document_url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    document_number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    issued_date = table.Column<DateOnly>(type: "date", nullable: true),
                    expiry_date = table.Column<DateOnly>(type: "date", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "PENDING"),
                    verified_by = table.Column<int>(type: "int", nullable: true),
                    verified_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__warehous__9666E8AC2F6AB1C2", x => x.document_id);
                    table.ForeignKey(
                        name: "FK_warehouse_documents_verifier",
                        column: x => x.verified_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_warehouse_documents_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_media",
                columns: table => new
                {
                    media_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    media_url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    media_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    display_order = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    is_primary = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    WarehouseId1 = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__warehous__D0A840F42AF1FBBB", x => x.media_id);
                    table.ForeignKey(
                        name: "FK_warehouse_media_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_warehouse_media_warehouses_WarehouseId1",
                        column: x => x.WarehouseId1,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "warehouse_memberships",
                columns: table => new
                {
                    membership_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_role_id = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_memberships", x => x.membership_id);
                    table.ForeignKey(
                        name: "FK_warehouse_memberships_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_warehouse_memberships_warehouse_roles_warehouse_role_id",
                        column: x => x.warehouse_role_id,
                        principalTable: "warehouse_roles",
                        principalColumn: "role_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_warehouse_memberships_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateTable(
                name: "audit_results",
                columns: table => new
                {
                    result_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    audit_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    expected_qty = table.Column<int>(type: "int", nullable: false),
                    actual_qty = table.Column<int>(type: "int", nullable: false),
                    discrepancy = table.Column<int>(type: "int", nullable: true, computedColumnSql: "([actual_qty]-[expected_qty])", stored: true),
                    discrepancy_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__audit_re__AFB3C316E98B7AC0", x => x.result_id);
                    table.ForeignKey(
                        name: "FK_audit_results_audit",
                        column: x => x.audit_id,
                        principalTable: "audit_sessions",
                        principalColumn: "audit_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inventory_items",
                columns: table => new
                {
                    item_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    inv_req_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    weight = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__inventor__52020FDDDDD8B22E", x => x.item_id);
                    table.ForeignKey(
                        name: "FK_inventory_items_request",
                        column: x => x.inv_req_id,
                        principalTable: "inventory_requests",
                        principalColumn: "inv_req_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "contracts",
                columns: table => new
                {
                    contract_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    request_id = table.Column<int>(type: "int", nullable: false),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    contract_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    contract_number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "ACTIVE"),
                    total_value = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "decimal(15,2)", nullable: true),
                    monthly_payment = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    terminated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    termination_reason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__contract__F8D664239D04D92E", x => x.contract_id);
                    table.ForeignKey(
                        name: "FK_contracts_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_contracts_request",
                        column: x => x.request_id,
                        principalTable: "rental_requests",
                        principalColumn: "request_id");
                    table.ForeignKey(
                        name: "FK_contracts_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "task_assignments",
                columns: table => new
                {
                    assignment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    task_id = table.Column<int>(type: "int", nullable: false),
                    membership_id = table.Column<int>(type: "int", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_assignments", x => x.assignment_id);
                    table.ForeignKey(
                        name: "FK_task_assignments_tasks_task_id",
                        column: x => x.task_id,
                        principalTable: "tasks",
                        principalColumn: "task_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_task_assignments_warehouse_memberships_membership_id",
                        column: x => x.membership_id,
                        principalTable: "warehouse_memberships",
                        principalColumn: "membership_id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_membership_skills",
                columns: table => new
                {
                    membership_id = table.Column<int>(type: "int", nullable: false),
                    skill_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_membership_skills", x => new { x.membership_id, x.skill_id });
                    table.ForeignKey(
                        name: "FK_warehouse_membership_skills_skills_skill_id",
                        column: x => x.skill_id,
                        principalTable: "skills",
                        principalColumn: "skill_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_warehouse_membership_skills_warehouse_memberships_membership_id",
                        column: x => x.membership_id,
                        principalTable: "warehouse_memberships",
                        principalColumn: "membership_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    payment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    payment_period = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    payment_date = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    due_date = table.Column<DateOnly>(type: "date", nullable: true),
                    payment_method = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "TRANSFER"),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "PENDING"),
                    transaction_reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__payments__ED1FC9EA910B49F8", x => x.payment_id);
                    table.ForeignKey(
                        name: "FK_payments_contract",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ratings",
                columns: table => new
                {
                    rating_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    contract_id = table.Column<int>(type: "int", nullable: true),
                    star = table.Column<int>(type: "int", nullable: false),
                    comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_hidden = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ratings__D35B278BC49635DF", x => x.rating_id);
                    table.ForeignKey(
                        name: "FK_ratings_contract",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_ratings_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_ratings_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_audit_results_audit",
                table: "audit_results",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "idx_audit_sessions_created_at",
                table: "audit_sessions",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_audit_sessions_status",
                table: "audit_sessions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_audit_sessions_warehouse",
                table: "audit_sessions",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_sessions_created_by",
                table: "audit_sessions",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "idx_contracts_dates",
                table: "contracts",
                columns: new[] { "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "idx_contracts_renter",
                table: "contracts",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "idx_contracts_request",
                table: "contracts",
                column: "request_id");

            migrationBuilder.CreateIndex(
                name: "idx_contracts_status",
                table: "contracts",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_contracts_warehouse",
                table: "contracts",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "UQ__contract__1CA37CCE4DCEA66E",
                table: "contracts",
                column: "contract_number",
                unique: true,
                filter: "[contract_number] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_iot",
                table: "equipments",
                column: "iot_device_id");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_status",
                table: "equipments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_warehouse",
                table: "equipments",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "idx_inventory_items_request",
                table: "inventory_items",
                column: "inv_req_id");

            migrationBuilder.CreateIndex(
                name: "idx_inventory_requests_created_at",
                table: "inventory_requests",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_inventory_requests_renter",
                table: "inventory_requests",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "idx_inventory_requests_status",
                table: "inventory_requests",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_inventory_requests_type",
                table: "inventory_requests",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "idx_inventory_requests_warehouse",
                table: "inventory_requests",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_requests_confirmed_by",
                table: "inventory_requests",
                column: "confirmed_by");

            migrationBuilder.CreateIndex(
                name: "idx_prt_token",
                table: "password_reset_tokens",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_prt_user_id",
                table: "password_reset_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_payments_contract",
                table: "payments",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_payments_due_date",
                table: "payments",
                column: "due_date");

            migrationBuilder.CreateIndex(
                name: "idx_payments_period",
                table: "payments",
                column: "payment_period");

            migrationBuilder.CreateIndex(
                name: "idx_payments_status",
                table: "payments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_ratings_created_at",
                table: "ratings",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_ratings_renter",
                table: "ratings",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "idx_ratings_star",
                table: "ratings",
                column: "star");

            migrationBuilder.CreateIndex(
                name: "idx_ratings_warehouse",
                table: "ratings",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_ratings_contract_id",
                table: "ratings",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_rental_requests_created_at",
                table: "rental_requests",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_rental_requests_renter",
                table: "rental_requests",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "idx_rental_requests_status",
                table: "rental_requests",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_rental_requests_warehouse",
                table: "rental_requests",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_requests_reviewed_by",
                table: "rental_requests",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "idx_role_name",
                table: "roles",
                column: "role_name");

            migrationBuilder.CreateIndex(
                name: "UQ__roles__783254B1C0716E85",
                table: "roles",
                column: "role_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_task_assignments_membership_id",
                table: "task_assignments",
                column: "membership_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_assignments_task_id",
                table: "task_assignments",
                column: "task_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_type_skills_skill_id",
                table: "task_type_skills",
                column: "skill_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_task_type_id",
                table: "tasks",
                column: "task_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_warehouse_id",
                table: "tasks",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "idx_users_created_at",
                table: "users",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_users_email",
                table: "users",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "idx_users_role",
                table: "users",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "idx_users_status",
                table: "users",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "UQ__users__AB6E616480871272",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_documents_verified_by",
                table: "warehouse_documents",
                column: "verified_by");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_documents_warehouse_id",
                table: "warehouse_documents",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "idx_warehouse_media_order",
                table: "warehouse_media",
                columns: new[] { "warehouse_id", "display_order" });

            migrationBuilder.CreateIndex(
                name: "idx_warehouse_media_warehouse",
                table: "warehouse_media",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_media_WarehouseId1",
                table: "warehouse_media",
                column: "WarehouseId1");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_membership_skills_skill_id",
                table: "warehouse_membership_skills",
                column: "skill_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_memberships_user_id_warehouse_id",
                table: "warehouse_memberships",
                columns: new[] { "user_id", "warehouse_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_memberships_warehouse_id",
                table: "warehouse_memberships",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_memberships_warehouse_role_id",
                table: "warehouse_memberships",
                column: "warehouse_role_id");

            migrationBuilder.CreateIndex(
                name: "idx_warehouses_created_at",
                table: "warehouses",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_warehouses_location",
                table: "warehouses",
                columns: new[] { "lat", "lng" });

            migrationBuilder.CreateIndex(
                name: "idx_warehouses_owner",
                table: "warehouses",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "idx_warehouses_status",
                table: "warehouses",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_warehouses_approved_by",
                table: "warehouses",
                column: "approved_by");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_results");

            migrationBuilder.DropTable(
                name: "equipments");

            migrationBuilder.DropTable(
                name: "inventory_items");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "ratings");

            migrationBuilder.DropTable(
                name: "task_assignments");

            migrationBuilder.DropTable(
                name: "task_type_skills");

            migrationBuilder.DropTable(
                name: "warehouse_documents");

            migrationBuilder.DropTable(
                name: "warehouse_media");

            migrationBuilder.DropTable(
                name: "warehouse_membership_skills");

            migrationBuilder.DropTable(
                name: "audit_sessions");

            migrationBuilder.DropTable(
                name: "inventory_requests");

            migrationBuilder.DropTable(
                name: "contracts");

            migrationBuilder.DropTable(
                name: "tasks");

            migrationBuilder.DropTable(
                name: "skills");

            migrationBuilder.DropTable(
                name: "warehouse_memberships");

            migrationBuilder.DropTable(
                name: "rental_requests");

            migrationBuilder.DropTable(
                name: "task_types");

            migrationBuilder.DropTable(
                name: "warehouse_roles");

            migrationBuilder.DropTable(
                name: "warehouses");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "roles");
        }
    }
}
