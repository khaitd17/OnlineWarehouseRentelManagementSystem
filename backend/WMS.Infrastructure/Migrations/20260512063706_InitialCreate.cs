using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contract_logs",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ip_address = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_logs", x => x.log_id);
                });

            migrationBuilder.CreateTable(
                name: "contract_verifications",
                columns: table => new
                {
                    verification_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    otp_code = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    is_verified = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    verified_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_verifications", x => x.verification_id);
                });

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
                name: "subscription_packages",
                columns: table => new
                {
                    package_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    price = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    duration_months = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    max_warehouses = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    max_staff_per_warehouse = table.Column<int>(type: "int", nullable: false, defaultValue: 5),
                    max_zones_per_warehouse = table.Column<int>(type: "int", nullable: false, defaultValue: 3),
                    max_total_area = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 500m),
                    allow_equipment_management = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscription_packages", x => x.package_id);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_roles",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
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
                name: "task_types",
                columns: table => new
                {
                    task_type_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_all_skill = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    is_manual = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    skill_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_types", x => x.task_type_id);
                    table.ForeignKey(
                        name: "FK_task_types_skills_skill_id",
                        column: x => x.skill_id,
                        principalTable: "skills",
                        principalColumn: "skill_id");
                });

            migrationBuilder.CreateTable(
                name: "ai_analysis_sessions",
                columns: table => new
                {
                    session_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    analyzed_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    image_urls = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    result_json = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    estimated_volume_m3 = table.Column<double>(type: "float", nullable: true),
                    suggested_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    special_notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    confidence = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_analysis_sessions", x => x.session_id);
                    table.ForeignKey(
                        name: "FK_ai_analysis_sessions_users",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    notification_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    reference_id = table.Column<int>(type: "int", nullable: true),
                    reference_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    is_read = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.notification_id);
                    table.ForeignKey(
                        name: "FK_notifications_user",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "owner_contract_templates",
                columns: table => new
                {
                    template_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    owner_id = table.Column<int>(type: "int", nullable: false),
                    template_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    use_basic_info_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_payment_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_violation_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_termination_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    use_signature_section = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    basic_info_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    payment_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    violation_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    termination_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    signature_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    additional_terms_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_default = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_owner_contract_templates", x => x.template_id);
                    table.ForeignKey(
                        name: "FK_owner_contract_templates_owner",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "user_id");
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
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "renter_assets",
                columns: table => new
                {
                    asset_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    asset_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "cái"),
                    weight_per_unit = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    VolumePerUnit = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_renter_assets", x => x.asset_id);
                    table.ForeignKey(
                        name: "FK_ra_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                columns: table => new
                {
                    subscription_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    plan = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    start_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    end_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    transaction_reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscriptions", x => x.subscription_id);
                    table.ForeignKey(
                        name: "FK_subscriptions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
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
                    WarehouseType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    total_area = table.Column<double>(type: "float", nullable: false),
                    Width = table.Column<double>(type: "float", nullable: true),
                    Length = table.Column<double>(type: "float", nullable: true),
                    Height = table.Column<double>(type: "float", nullable: true),
                    BoundaryPoints = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MainDoorDirection = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GatePosition = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    available_area = table.Column<double>(type: "float", nullable: false),
                    available_volume = table.Column<double>(type: "float", nullable: true),
                    PricePerM2 = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    operating_hours = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    is_24_hours_access = table.Column<bool>(type: "bit", nullable: false),
                    open_time = table.Column<TimeSpan>(type: "time", nullable: true),
                    close_time = table.Column<TimeSpan>(type: "time", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "PENDING"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    approved_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    approved_by = table.Column<int>(type: "int", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    submission_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "NEW"),
                    pending_change_note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
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
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    assigned_to = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__audit_se__5AF33E337F6DAD00", x => x.audit_id);
                    table.ForeignKey(
                        name: "FK_audit_sessions_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_audit_sessions_creator",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_audit_sessions_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
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
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true, defaultValue: "PENDING"),
                    request_code = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    confirmed_by = table.Column<int>(type: "int", nullable: true),
                    confirmed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    assigned_staff_id = table.Column<int>(type: "int", nullable: true),
                    assigned_note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    assigned_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    ScheduledDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    renter_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    manager_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    staff_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    document_urls = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    volume_warning = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__inventor__A56BE5DEA2C9FF70", x => x.inv_req_id);
                    table.ForeignKey(
                        name: "FK_inventory_requests_assigned_staff",
                        column: x => x.assigned_staff_id,
                        principalTable: "users",
                        principalColumn: "user_id");
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
                name: "rental_areas",
                columns: table => new
                {
                    rental_area_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    size = table.Column<double>(type: "float", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    PositionX = table.Column<double>(type: "float", nullable: true),
                    PositionY = table.Column<double>(type: "float", nullable: true),
                    Width = table.Column<double>(type: "float", nullable: true),
                    Length = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_areas", x => x.rental_area_id);
                    table.ForeignKey(
                        name: "FK_rental_areas_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "renter_inventory",
                columns: table => new
                {
                    inventory_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    asset_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_renter_inventory", x => x.inventory_id);
                    table.ForeignKey(
                        name: "FK_ri_asset",
                        column: x => x.asset_id,
                        principalTable: "renter_assets",
                        principalColumn: "asset_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ri_warehouse",
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
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    scheduled_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ref_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ref_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasks", x => x.task_id);
                    table.ForeignKey(
                        name: "FK_tasks_task_types_task_type_id",
                        column: x => x.task_type_id,
                        principalTable: "task_types",
                        principalColumn: "task_type_id");
                    table.ForeignKey(
                        name: "FK_tasks_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
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
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "warehouse_grid_locations",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    coordinates = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    asset_id = table.Column<int>(type: "int", nullable: true),
                    item_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    renter_id = table.Column<int>(type: "int", nullable: true),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_grid_locations", x => x.id);
                    table.ForeignKey(
                        name: "FK_warehouse_grid_locations_asset",
                        column: x => x.asset_id,
                        principalTable: "renter_assets",
                        principalColumn: "asset_id");
                    table.ForeignKey(
                        name: "FK_warehouse_grid_locations_renter",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_warehouse_grid_locations_wh",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_inventory",
                columns: table => new
                {
                    inventory_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "cái"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_inventory", x => x.inventory_id);
                    table.ForeignKey(
                        name: "FK_warehouse_inventory_wh",
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
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__warehous__D0A840F42AF1FBBB", x => x.media_id);
                    table.ForeignKey(
                        name: "FK_warehouse_media_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "warehouse_shifts",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    start_time = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    end_time = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_shifts", x => x.id);
                    table.ForeignKey(
                        name: "FK_warehouse_shifts_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "zones",
                columns: table => new
                {
                    zone_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_zones", x => x.zone_id);
                    table.ForeignKey(
                        name: "FK_zones_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
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
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    recorded_by = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__audit_re__AFB3C316E98B7AC0", x => x.result_id);
                    table.ForeignKey(
                        name: "FK_audit_results_audit",
                        column: x => x.audit_id,
                        principalTable: "audit_sessions",
                        principalColumn: "audit_id");
                    table.ForeignKey(
                        name: "FK_audit_results_recorded_by",
                        column: x => x.recorded_by,
                        principalTable: "users",
                        principalColumn: "user_id");
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
                    EstimatedVolume = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    VerifiedVolume = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    VerifiedWeight = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    asset_id = table.Column<int>(type: "int", nullable: true),
                    verified_quantity = table.Column<int>(type: "int", nullable: true),
                    verify_note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__inventor__52020FDDDDD8B22E", x => x.item_id);
                    table.ForeignKey(
                        name: "FK_inventory_items_asset",
                        column: x => x.asset_id,
                        principalTable: "renter_assets",
                        principalColumn: "asset_id");
                    table.ForeignKey(
                        name: "FK_inventory_items_request",
                        column: x => x.inv_req_id,
                        principalTable: "inventory_requests",
                        principalColumn: "inv_req_id");
                });

            migrationBuilder.CreateTable(
                name: "receipt_notes",
                columns: table => new
                {
                    receipt_note_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    inv_req_id = table.Column<int>(type: "int", nullable: false),
                    receipt_code = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    received_by_staff_id = table.Column<int>(type: "int", nullable: false),
                    received_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    staff_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    renter_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "DRAFT"),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_receipt_notes", x => x.receipt_note_id);
                    table.ForeignKey(
                        name: "FK_receipt_notes_request",
                        column: x => x.inv_req_id,
                        principalTable: "inventory_requests",
                        principalColumn: "inv_req_id");
                    table.ForeignKey(
                        name: "FK_receipt_notes_staff",
                        column: x => x.received_by_staff_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "equipments",
                columns: table => new
                {
                    equipment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    rental_area_id = table.Column<int>(type: "int", nullable: true),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    serial_number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    location = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    specifications = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "AVAILABLE"),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    iot_device_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    maintenance_cycle_days = table.Column<int>(type: "int", nullable: true),
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
                        name: "FK_equipments_rental_area",
                        column: x => x.rental_area_id,
                        principalTable: "rental_areas",
                        principalColumn: "rental_area_id");
                    table.ForeignKey(
                        name: "FK_equipments_warehouse",
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
                    RentalAreaId = table.Column<int>(type: "int", nullable: true),
                    requested_area = table.Column<double>(type: "float", nullable: false),
                    start_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    duration_months = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "PENDING"),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    reviewed_by = table.Column<int>(type: "int", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    contract_image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    is_custom_area = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    is_owner_assigned = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    proposed_position_x = table.Column<double>(type: "float", nullable: true),
                    proposed_position_y = table.Column<double>(type: "float", nullable: true),
                    proposed_width = table.Column<double>(type: "float", nullable: true),
                    proposed_length = table.Column<double>(type: "float", nullable: true),
                    base_rental_area_id = table.Column<int>(type: "int", nullable: true),
                    has_extension_zone = table.Column<bool>(type: "bit", nullable: false),
                    extension_position_x = table.Column<double>(type: "float", nullable: true),
                    extension_position_y = table.Column<double>(type: "float", nullable: true),
                    extension_width = table.Column<double>(type: "float", nullable: true),
                    extension_length = table.Column<double>(type: "float", nullable: true),
                    additional_zones_json = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    cancellation_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    cancelled_by = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__rental_r__18D3B90F92B6C93A", x => x.request_id);
                    table.ForeignKey(
                        name: "FK_rental_requests_rental_areas_RentalAreaId",
                        column: x => x.RentalAreaId,
                        principalTable: "rental_areas",
                        principalColumn: "rental_area_id");
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
                name: "unit_tasks",
                columns: table => new
                {
                    unit_task_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    warehouse_task_id = table.Column<int>(type: "int", nullable: false),
                    unit_task_type_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    order = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    completed_by = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unit_tasks", x => x.unit_task_id);
                    table.ForeignKey(
                        name: "FK_unit_tasks_tasks_warehouse_task_id",
                        column: x => x.warehouse_task_id,
                        principalTable: "tasks",
                        principalColumn: "task_id");
                    table.ForeignKey(
                        name: "FK_unit_tasks_users_completed_by",
                        column: x => x.completed_by,
                        principalTable: "users",
                        principalColumn: "user_id");
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
                    is_all_skill = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    is_all_zone = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    warehouse_shift_id = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_memberships", x => x.membership_id);
                    table.ForeignKey(
                        name: "FK_warehouse_memberships_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_warehouse_memberships_warehouse_roles_warehouse_role_id",
                        column: x => x.warehouse_role_id,
                        principalTable: "warehouse_roles",
                        principalColumn: "role_id");
                    table.ForeignKey(
                        name: "FK_warehouse_memberships_warehouse_shifts_warehouse_shift_id",
                        column: x => x.warehouse_shift_id,
                        principalTable: "warehouse_shifts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_warehouse_memberships_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "inventory_transactions",
                columns: table => new
                {
                    transaction_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    inv_req_id = table.Column<int>(type: "int", nullable: false),
                    type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "cái"),
                    performed_by = table.Column<int>(type: "int", nullable: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    receipt_note_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_transactions", x => x.transaction_id);
                    table.ForeignKey(
                        name: "FK_inv_transactions_performer",
                        column: x => x.performed_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_inv_transactions_receipt_note",
                        column: x => x.receipt_note_id,
                        principalTable: "receipt_notes",
                        principalColumn: "receipt_note_id");
                    table.ForeignKey(
                        name: "FK_inv_transactions_request",
                        column: x => x.inv_req_id,
                        principalTable: "inventory_requests",
                        principalColumn: "inv_req_id");
                    table.ForeignKey(
                        name: "FK_inv_transactions_warehouse",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "receipt_items",
                columns: table => new
                {
                    receipt_item_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    receipt_note_id = table.Column<int>(type: "int", nullable: false),
                    inventory_item_id = table.Column<int>(type: "int", nullable: true),
                    asset_id = table.Column<int>(type: "int", nullable: true),
                    item_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    expected_quantity = table.Column<int>(type: "int", nullable: false),
                    received_quantity = table.Column<int>(type: "int", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "cái"),
                    verified_volume = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    verified_weight = table.Column<decimal>(type: "decimal(10,3)", nullable: true),
                    note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_receipt_items", x => x.receipt_item_id);
                    table.ForeignKey(
                        name: "FK_receipt_items_asset",
                        column: x => x.asset_id,
                        principalTable: "renter_assets",
                        principalColumn: "asset_id");
                    table.ForeignKey(
                        name: "FK_receipt_items_inv_item",
                        column: x => x.inventory_item_id,
                        principalTable: "inventory_items",
                        principalColumn: "item_id");
                    table.ForeignKey(
                        name: "FK_receipt_items_note",
                        column: x => x.receipt_note_id,
                        principalTable: "receipt_notes",
                        principalColumn: "receipt_note_id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "contracts",
                columns: table => new
                {
                    contract_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    request_id = table.Column<int>(type: "int", nullable: false),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    contract_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    signed_file_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    signed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    terms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    contract_number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true, defaultValue: "DRAFT"),
                    total_value = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "decimal(15,2)", nullable: true),
                    monthly_payment = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    owner_signed_file_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    owner_signed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    owner_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    renter_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TerminatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TerminationReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    termination_requested_by = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    termination_requested_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    renter_approved_termination = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    owner_approved_termination = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    early_termination_fee = table.Column<decimal>(type: "decimal(15,2)", nullable: true)
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
                name: "rental_contracts",
                columns: table => new
                {
                    contract_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    rental_request_id = table.Column<int>(type: "int", nullable: false),
                    contract_number = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    renter_id = table.Column<int>(type: "int", nullable: false),
                    warehouse_id = table.Column<int>(type: "int", nullable: false),
                    start_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    end_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    monthly_payment = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    total_value = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "decimal(15,2)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    terms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    contract_file_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    signed_file_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    signed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    owner_signed_file_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    owner_signed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    owner_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    renter_signature_base64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    parent_contract_id = table.Column<int>(type: "int", nullable: true),
                    returned_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    cancellation_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TerminatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TerminationReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GracePeriodHours = table.Column<int>(type: "int", nullable: false),
                    CancellationFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    owner_signature_expiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RenterSignatureExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PaymentExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TerminationRequestedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TerminationRequestedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RenterApprovedTermination = table.Column<bool>(type: "bit", nullable: false),
                    OwnerApprovedTermination = table.Column<bool>(type: "bit", nullable: false),
                    EarlyTerminationFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_contracts", x => x.contract_id);
                    table.ForeignKey(
                        name: "FK_rental_contracts_rental_requests_rental_request_id",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "request_id");
                    table.ForeignKey(
                        name: "FK_rental_contracts_users_renter_id",
                        column: x => x.renter_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_rental_contracts_warehouses_warehouse_id",
                        column: x => x.warehouse_id,
                        principalTable: "warehouses",
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "staff_shifts",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    membership_id = table.Column<int>(type: "int", nullable: false),
                    shift_date = table.Column<DateOnly>(type: "date", nullable: false),
                    time_in1 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    time_out1 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    time_in2 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    time_out2 = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    shift_type = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    overtime_hours = table.Column<decimal>(type: "decimal(4,1)", nullable: false, defaultValue: 0m),
                    check_in_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    check_in_photo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    check_out_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    check_out_photo = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_shifts", x => x.id);
                    table.ForeignKey(
                        name: "FK_staff_shifts_membership",
                        column: x => x.membership_id,
                        principalTable: "warehouse_memberships",
                        principalColumn: "membership_id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "warehouse_membership_zones",
                columns: table => new
                {
                    membership_id = table.Column<int>(type: "int", nullable: false),
                    zone_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_membership_zones", x => new { x.membership_id, x.zone_id });
                    table.ForeignKey(
                        name: "FK_warehouse_membership_zones_warehouse_memberships_membership_id",
                        column: x => x.membership_id,
                        principalTable: "warehouse_memberships",
                        principalColumn: "membership_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_warehouse_membership_zones_zones_zone_id",
                        column: x => x.zone_id,
                        principalTable: "zones",
                        principalColumn: "zone_id",
                        onDelete: ReferentialAction.Cascade);
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

            migrationBuilder.CreateTable(
                name: "contract_extensions",
                columns: table => new
                {
                    extension_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    original_contract_id = table.Column<int>(type: "int", nullable: false),
                    new_contract_id = table.Column<int>(type: "int", nullable: true),
                    requester_id = table.Column<int>(type: "int", nullable: false),
                    duration_months = table.Column<int>(type: "int", nullable: false),
                    proposed_monthly_payment = table.Column<decimal>(type: "decimal(15,2)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    requested_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    reviewed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    reviewed_by = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_extensions", x => x.extension_id);
                    table.ForeignKey(
                        name: "FK_contract_extensions_contracts_new_contract_id",
                        column: x => x.new_contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_extensions_contracts_original_contract_id",
                        column: x => x.original_contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_extensions_users_requester_id",
                        column: x => x.requester_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_contract_extensions_users_reviewed_by",
                        column: x => x.reviewed_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "contract_revision_threads",
                columns: table => new
                {
                    thread_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    section = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "OPEN"),
                    created_by = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    resolved_by = table.Column<int>(type: "int", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_revision_threads", x => x.thread_id);
                    table.ForeignKey(
                        name: "FK_contract_revision_threads_contract",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_revision_threads_resolved_by",
                        column: x => x.resolved_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_contract_revision_threads_user",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "contract_versions",
                columns: table => new
                {
                    version_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    version_number = table.Column<int>(type: "int", nullable: false),
                    snapshot_json = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_by = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_versions", x => x.version_id);
                    table.ForeignKey(
                        name: "FK_contract_versions_contract",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_contract_versions_user",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

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
                        principalColumn: "contract_id");
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
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    owner_reply = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    replied_at = table.Column<DateTime>(type: "datetime2", nullable: true)
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
                        principalColumn: "warehouse_id");
                });

            migrationBuilder.CreateTable(
                name: "rental_payments",
                columns: table => new
                {
                    payment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(15,2)", nullable: false),
                    payment_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    payment_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    payment_method = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "BANK_TRANSFER"),
                    sepay_transaction_id = table.Column<int>(type: "int", nullable: true),
                    sepay_reference_code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    paid_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    expired_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    MaxRetry = table.Column<int>(type: "int", nullable: false),
                    LastRetryAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_payments", x => x.payment_id);
                    table.ForeignKey(
                        name: "FK_rental_payments_contracts",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                });

            migrationBuilder.CreateTable(
                name: "cancellation_logs",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    rental_request_id = table.Column<int>(type: "int", nullable: true),
                    rental_contract_id = table.Column<int>(type: "int", nullable: true),
                    cancelled_stage = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    cancelled_by = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    cancellation_reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    refund_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    cancellation_fee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cancellation_logs", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_cancellation_logs_rental_contracts",
                        column: x => x.rental_contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cancellation_logs_rental_requests",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "request_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaymentTerms",
                columns: table => new
                {
                    TermId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContractId = table.Column<int>(type: "int", nullable: false),
                    MonthsPerTerm = table.Column<int>(type: "int", nullable: false),
                    AllowedOverdueDays = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTerms", x => x.TermId);
                    table.ForeignKey(
                        name: "FK_PaymentTerms_rental_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "warehouse_returns",
                columns: table => new
                {
                    return_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    inspector_id = table.Column<int>(type: "int", nullable: true),
                    inspection_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    is_clean = table.Column<bool>(type: "bit", nullable: false),
                    is_equipment_intact = table.Column<bool>(type: "bit", nullable: false),
                    is_no_outstanding_debt = table.Column<bool>(type: "bit", nullable: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    damage_fee = table.Column<decimal>(type: "decimal(15,2)", nullable: true),
                    penalty_fee = table.Column<decimal>(type: "decimal(15,2)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouse_returns", x => x.return_id);
                    table.ForeignKey(
                        name: "FK_warehouse_returns_rental_contracts_contract_id",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id");
                    table.ForeignKey(
                        name: "FK_warehouse_returns_users_inspector_id",
                        column: x => x.inspector_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "contract_revision_comments",
                columns: table => new
                {
                    comment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    thread_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_revision_comments", x => x.comment_id);
                    table.ForeignKey(
                        name: "FK_contract_revision_comments_thread",
                        column: x => x.thread_id,
                        principalTable: "contract_revision_threads",
                        principalColumn: "thread_id");
                    table.ForeignKey(
                        name: "FK_contract_revision_comments_user",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "refunds",
                columns: table => new
                {
                    refund_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    payment_id = table.Column<int>(type: "int", nullable: true),
                    contract_id = table.Column<int>(type: "int", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    reason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    processed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refunds", x => x.refund_id);
                    table.ForeignKey(
                        name: "FK_refunds_rental_contracts",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_refunds_rental_payments",
                        column: x => x.payment_id,
                        principalTable: "rental_payments",
                        principalColumn: "payment_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "return_images",
                columns: table => new
                {
                    image_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    return_id = table.Column<int>(type: "int", nullable: false),
                    image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_return_images", x => x.image_id);
                    table.ForeignKey(
                        name: "FK_return_images_warehouse_returns_return_id",
                        column: x => x.return_id,
                        principalTable: "warehouse_returns",
                        principalColumn: "return_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ai_analysis_sessions_user_id",
                table: "ai_analysis_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_audit_results_audit",
                table: "audit_results",
                column: "audit_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_results_recorded_by",
                table: "audit_results",
                column: "recorded_by");

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
                name: "IX_audit_sessions_assigned_to",
                table: "audit_sessions",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_audit_sessions_created_by",
                table: "audit_sessions",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_logs_created_at",
                table: "cancellation_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_logs_rental_contract_id",
                table: "cancellation_logs",
                column: "rental_contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_logs_rental_request_id",
                table: "cancellation_logs",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_extensions_new_contract_id",
                table: "contract_extensions",
                column: "new_contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_extensions_original_contract_id",
                table: "contract_extensions",
                column: "original_contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_extensions_requester_id",
                table: "contract_extensions",
                column: "requester_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_extensions_reviewed_by",
                table: "contract_extensions",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "idx_cl_contract",
                table: "contract_logs",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_contract_revision_comments_thread",
                table: "contract_revision_comments",
                column: "thread_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_revision_comments_user_id",
                table: "contract_revision_comments",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_contract_revision_threads_contract",
                table: "contract_revision_threads",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_contract_revision_threads_created_by",
                table: "contract_revision_threads",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_contract_revision_threads_resolved_by",
                table: "contract_revision_threads",
                column: "resolved_by");

            migrationBuilder.CreateIndex(
                name: "idx_cv_contract",
                table: "contract_verifications",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_cv_user",
                table: "contract_verifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_contract_versions_contract",
                table: "contract_versions",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_contract_versions_contract_version",
                table: "contract_versions",
                columns: new[] { "contract_id", "version_number" });

            migrationBuilder.CreateIndex(
                name: "IX_contract_versions_created_by",
                table: "contract_versions",
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
                name: "IX_equipment_histories_ContractId",
                table: "equipment_histories",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_histories_EquipmentId",
                table: "equipment_histories",
                column: "EquipmentId");

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

            migrationBuilder.CreateIndex(
                name: "IX_equipment_maintenance_records_EquipmentId",
                table: "equipment_maintenance_records",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_area",
                table: "equipments",
                column: "rental_area_id");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_status",
                table: "equipments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_equipments_warehouse",
                table: "equipments",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "UQ__equipments__iot",
                table: "equipments",
                column: "iot_device_id",
                unique: true,
                filter: "[iot_device_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UQ__equipments__serial",
                table: "equipments",
                column: "serial_number",
                unique: true,
                filter: "[serial_number] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_inventory_items_asset",
                table: "inventory_items",
                column: "asset_id");

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
                name: "IX_inventory_requests_assigned_staff_id",
                table: "inventory_requests",
                column: "assigned_staff_id");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_requests_confirmed_by",
                table: "inventory_requests",
                column: "confirmed_by");

            migrationBuilder.CreateIndex(
                name: "UQ_inventory_requests_code",
                table: "inventory_requests",
                column: "request_code",
                unique: true,
                filter: "[request_code] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_inv_transactions_created",
                table: "inventory_transactions",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_inv_transactions_type",
                table: "inventory_transactions",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "idx_inv_transactions_warehouse",
                table: "inventory_transactions",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_transactions_inv_req_id",
                table: "inventory_transactions",
                column: "inv_req_id");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_transactions_performed_by",
                table: "inventory_transactions",
                column: "performed_by");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_transactions_receipt_note_id",
                table: "inventory_transactions",
                column: "receipt_note_id");

            migrationBuilder.CreateIndex(
                name: "idx_notifications_created_at",
                table: "notifications",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_notifications_is_read",
                table: "notifications",
                column: "is_read");

            migrationBuilder.CreateIndex(
                name: "idx_notifications_user",
                table: "notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_owner_contract_templates_default",
                table: "owner_contract_templates",
                columns: new[] { "owner_id", "is_default" });

            migrationBuilder.CreateIndex(
                name: "idx_owner_contract_templates_owner",
                table: "owner_contract_templates",
                column: "owner_id");

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
                name: "IX_PaymentTerms_ContractId",
                table: "PaymentTerms",
                column: "ContractId",
                unique: true);

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
                name: "idx_receipt_items_note",
                table: "receipt_items",
                column: "receipt_note_id");

            migrationBuilder.CreateIndex(
                name: "IX_receipt_items_asset_id",
                table: "receipt_items",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_receipt_items_inventory_item_id",
                table: "receipt_items",
                column: "inventory_item_id");

            migrationBuilder.CreateIndex(
                name: "idx_receipt_notes_request",
                table: "receipt_notes",
                column: "inv_req_id");

            migrationBuilder.CreateIndex(
                name: "IX_receipt_notes_received_by_staff_id",
                table: "receipt_notes",
                column: "received_by_staff_id");

            migrationBuilder.CreateIndex(
                name: "UQ_receipt_notes_code",
                table: "receipt_notes",
                column: "receipt_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refunds_contract_id",
                table: "refunds",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_created_at",
                table: "refunds",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_payment_id",
                table: "refunds",
                column: "payment_id");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_status",
                table: "refunds",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_rental_areas_warehouse_id",
                table: "rental_areas",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_contracts_rental_request_id",
                table: "rental_contracts",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_contracts_renter_id",
                table: "rental_contracts",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_contracts_warehouse_id",
                table: "rental_contracts",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "idx_rental_payments_contract",
                table: "rental_payments",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_rental_payments_status",
                table: "rental_payments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "UQ_rental_payments_code",
                table: "rental_payments",
                column: "payment_code",
                unique: true);

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
                name: "IX_rental_requests_RentalAreaId",
                table: "rental_requests",
                column: "RentalAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_rental_requests_reviewed_by",
                table: "rental_requests",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "idx_ra_renter",
                table: "renter_assets",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "idx_ri_asset",
                table: "renter_inventory",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "idx_ri_warehouse",
                table: "renter_inventory",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "UQ_renter_inventory",
                table: "renter_inventory",
                columns: new[] { "asset_id", "warehouse_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_return_images_return_id",
                table: "return_images",
                column: "return_id");

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
                name: "UQ_staff_shifts_membership_date",
                table: "staff_shifts",
                columns: new[] { "membership_id", "shift_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_user_id",
                table: "subscriptions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_types_skill_id",
                table: "task_types",
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
                name: "IX_unit_tasks_completed_by",
                table: "unit_tasks",
                column: "completed_by");

            migrationBuilder.CreateIndex(
                name: "IX_unit_tasks_warehouse_task_id",
                table: "unit_tasks",
                column: "warehouse_task_id");

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
                name: "idx_warehouse_grid_locations_pos",
                table: "warehouse_grid_locations",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_grid_locations_asset_id",
                table: "warehouse_grid_locations",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_grid_locations_renter_id",
                table: "warehouse_grid_locations",
                column: "renter_id");

            migrationBuilder.CreateIndex(
                name: "UQ_warehouse_inventory_item",
                table: "warehouse_inventory",
                columns: new[] { "warehouse_id", "item_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_warehouse_media_order",
                table: "warehouse_media",
                columns: new[] { "warehouse_id", "display_order" });

            migrationBuilder.CreateIndex(
                name: "idx_warehouse_media_warehouse",
                table: "warehouse_media",
                column: "warehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_membership_skills_skill_id",
                table: "warehouse_membership_skills",
                column: "skill_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_membership_zones_zone_id",
                table: "warehouse_membership_zones",
                column: "zone_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_memberships_user_warehouse_role",
                table: "warehouse_memberships",
                columns: new[] { "user_id", "warehouse_id", "warehouse_role_id" },
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
                name: "IX_warehouse_memberships_warehouse_shift_id",
                table: "warehouse_memberships",
                column: "warehouse_shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_returns_contract_id",
                table: "warehouse_returns",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_returns_inspector_id",
                table: "warehouse_returns",
                column: "inspector_id");

            migrationBuilder.CreateIndex(
                name: "IX_warehouse_shifts_warehouse_id",
                table: "warehouse_shifts",
                column: "warehouse_id");

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

            migrationBuilder.CreateIndex(
                name: "IX_zones_warehouse_id",
                table: "zones",
                column: "warehouse_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_analysis_sessions");

            migrationBuilder.DropTable(
                name: "audit_results");

            migrationBuilder.DropTable(
                name: "cancellation_logs");

            migrationBuilder.DropTable(
                name: "contract_extensions");

            migrationBuilder.DropTable(
                name: "contract_logs");

            migrationBuilder.DropTable(
                name: "contract_revision_comments");

            migrationBuilder.DropTable(
                name: "contract_verifications");

            migrationBuilder.DropTable(
                name: "contract_versions");

            migrationBuilder.DropTable(
                name: "equipment_histories");

            migrationBuilder.DropTable(
                name: "equipment_incident_attachments");

            migrationBuilder.DropTable(
                name: "equipment_incident_comments");

            migrationBuilder.DropTable(
                name: "equipment_maintenance_records");

            migrationBuilder.DropTable(
                name: "inventory_transactions");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "owner_contract_templates");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "PaymentTerms");

            migrationBuilder.DropTable(
                name: "ratings");

            migrationBuilder.DropTable(
                name: "receipt_items");

            migrationBuilder.DropTable(
                name: "refunds");

            migrationBuilder.DropTable(
                name: "renter_inventory");

            migrationBuilder.DropTable(
                name: "return_images");

            migrationBuilder.DropTable(
                name: "staff_shifts");

            migrationBuilder.DropTable(
                name: "subscription_packages");

            migrationBuilder.DropTable(
                name: "subscriptions");

            migrationBuilder.DropTable(
                name: "unit_tasks");

            migrationBuilder.DropTable(
                name: "warehouse_documents");

            migrationBuilder.DropTable(
                name: "warehouse_grid_locations");

            migrationBuilder.DropTable(
                name: "warehouse_inventory");

            migrationBuilder.DropTable(
                name: "warehouse_media");

            migrationBuilder.DropTable(
                name: "warehouse_membership_skills");

            migrationBuilder.DropTable(
                name: "warehouse_membership_zones");

            migrationBuilder.DropTable(
                name: "audit_sessions");

            migrationBuilder.DropTable(
                name: "contract_revision_threads");

            migrationBuilder.DropTable(
                name: "equipment_incidents");

            migrationBuilder.DropTable(
                name: "inventory_items");

            migrationBuilder.DropTable(
                name: "receipt_notes");

            migrationBuilder.DropTable(
                name: "rental_payments");

            migrationBuilder.DropTable(
                name: "warehouse_returns");

            migrationBuilder.DropTable(
                name: "tasks");

            migrationBuilder.DropTable(
                name: "warehouse_memberships");

            migrationBuilder.DropTable(
                name: "zones");

            migrationBuilder.DropTable(
                name: "equipments");

            migrationBuilder.DropTable(
                name: "renter_assets");

            migrationBuilder.DropTable(
                name: "inventory_requests");

            migrationBuilder.DropTable(
                name: "contracts");

            migrationBuilder.DropTable(
                name: "rental_contracts");

            migrationBuilder.DropTable(
                name: "task_types");

            migrationBuilder.DropTable(
                name: "warehouse_roles");

            migrationBuilder.DropTable(
                name: "warehouse_shifts");

            migrationBuilder.DropTable(
                name: "rental_requests");

            migrationBuilder.DropTable(
                name: "skills");

            migrationBuilder.DropTable(
                name: "rental_areas");

            migrationBuilder.DropTable(
                name: "warehouses");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "roles");
        }
    }
}
