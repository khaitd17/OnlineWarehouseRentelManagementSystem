using FluentValidation;
using MediatR;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WMS.Application.Behaviors;
using WMS.Application.Features.Auth.Register;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;
using WMS.Infrastructure.Repositories;
using WMS.Infrastructure.Services;
using WMS.API.Hubs;
using Hangfire;
using Hangfire.SqlServer;
using WMS.Infrastructure.BackgroundJobs;
using WMS.API.Filters;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. Add Services to the container
// ==========================================

// Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Add HttpClient for SepayService
builder.Services.AddHttpClient();

// Swashbuckle/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "OWRMS API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhập: Bearer {token}"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Database Context - merged from ScaffoldModels
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// MediatR Registration - scan tất cả handlers trong Application assembly
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblies(
        typeof(RegisterCommand).Assembly,
        typeof(ApplicationDbContext).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
    cfg.AddOpenBehavior(typeof(WarehouseLockProtectionBehavior<,>));
});

// FluentValidation Registration
builder.Services.AddValidatorsFromAssemblyContaining(typeof(RegisterCommand));

// ---- Dependency Injection ----
// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IWarehouseRepository, WarehouseRepository>();
builder.Services.AddScoped<IWarehouseMediaRepository, WarehouseMediaRepository>();
builder.Services.AddScoped<IWarehouseDocumentRepository, WarehouseDocumentRepository>();
builder.Services.AddScoped<IStaffAssigmentRepository, StaffAssigmentRepository>();
builder.Services.AddScoped<IRentalRequestRepository, RentalRequestRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IInventoryRequestRepository, WMS.Infrastructure.Repositories.InventoryRequestRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IWarehouseInventoryRepository, WMS.Infrastructure.Repositories.WarehouseInventoryRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IInventoryTransactionRepository, WMS.Infrastructure.Repositories.InventoryTransactionRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IRentalContractRepository, WMS.Infrastructure.Repositories.RentalContractRepository>();
builder.Services.AddScoped<IStaffMembershipRepository, StaffMembershipRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IRentalAreaRepository, WMS.Infrastructure.Repositories.RentalAreaRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<IEquipmentRepository, EquipmentRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.INotificationRepository, WMS.Infrastructure.Repositories.NotificationRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IContractVerificationRepository, WMS.Infrastructure.Repositories.ContractVerificationRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IContractLogRepository, WMS.Infrastructure.Repositories.ContractLogRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.ICancellationLogRepository, WMS.Infrastructure.Repositories.CancellationLogRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IRefundRepository, WMS.Infrastructure.Repositories.RefundRepository>();
builder.Services.AddScoped<IStaffShiftRepository, StaffShiftRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IPaymentRepository, WMS.Infrastructure.Repositories.PaymentRepository>();
builder.Services.AddScoped<IRenterAssetRepository, RenterAssetRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IRatingRepository, WMS.Infrastructure.Repositories.RatingRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IWarehouseReturnRepository, WMS.Infrastructure.Repositories.WarehouseReturnRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IRentalPaymentRepository, WMS.Infrastructure.Repositories.RentalPaymentRepository>();
builder.Services.AddScoped<IEquipmentIncidentRepository, EquipmentIncidentRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IContractExtensionRepository, WMS.Infrastructure.Repositories.ContractExtensionRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.ISubscriptionRepository, WMS.Infrastructure.Repositories.SubscriptionRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.ISubscriptionPackageRepository, WMS.Infrastructure.Repositories.SubscriptionPackageRepository>();

// Services   
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPasswordGenerator, PasswordGenerator>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<ISepayService, SepayService>();
builder.Services.AddScoped<ISubscriptionService, WMS.Infrastructure.Services.SubscriptionService>();

// SignalR
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationSender, WMS.API.Hubs.SignalRNotificationSender>();

// ── AI Analysis Feature ──────────────────────────────────────────
builder.Services.AddScoped<WMS.Domain.Interfaces.IAiAnalysisSessionRepository, WMS.Infrastructure.Repositories.AiAnalysisSessionRepository>();
builder.Services.AddScoped<WMS.Domain.Interfaces.IGeminiService, WMS.Infrastructure.Services.GeminiService>();
// Named HttpClient cho Gemini (timeout 60s – xử lý ảnh có thể chậm)
builder.Services.AddHttpClient("Gemini", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});

// Hangfire Configuration
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection"),
        new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true
        }));

builder.Services.AddHangfireServer();
builder.Services.Configure<WMS.Infrastructure.Services.SepaySettings>(builder.Configuration.GetSection("SePay"));

// Background job classes
builder.Services.AddScoped<ContractNotificationJob>();
builder.Services.AddScoped<ContractExpiryJob>();
builder.Services.AddScoped<SubscriptionExpiryJob>();

// JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "A_VERY_SECRET_DEVELOPMENT_KEY_THAT_IS_LONG_ENOUGH"))
    };

    // Allow SignalR to receive token from query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000","http://localhost:3001", "http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});
builder.Services.AddAuthorization();


// ==========================================
// 2. Build the Application
// ==========================================

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        // 1. Apply any pending migrations automatically
        // DISABLED: Migrations causing conflicts - use manual SQL scripts instead
        // context.Database.Migrate();

        // Patch: Thêm các cột còn thiếu cho contracts/rental_contracts để tránh lỗi runtime khi DB schema cũ.
        var patchSqls = new[]
        {
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'early_termination_fee') ALTER TABLE contracts ADD early_termination_fee decimal(18,2) NULL;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'owner_approved_termination') ALTER TABLE contracts ADD owner_approved_termination bit NOT NULL DEFAULT 0;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'renter_approved_termination') ALTER TABLE contracts ADD renter_approved_termination bit NOT NULL DEFAULT 0;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'termination_requested_at') ALTER TABLE contracts ADD termination_requested_at datetime2 NULL;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'termination_requested_by') ALTER TABLE contracts ADD termination_requested_by nvarchar(50) NULL;",
            // Patch: sửa FK contract_extensions đang trỏ nhầm rental_contracts -> contracts
            @"IF OBJECT_ID('contract_extensions', 'U') IS NOT NULL
              BEGIN
                  DECLARE @fkOriginal NVARCHAR(128);
                  SELECT TOP 1 @fkOriginal = fk.name
                  FROM sys.foreign_keys fk
                  JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                  JOIN sys.tables pt ON fkc.parent_object_id = pt.object_id
                  JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
                  JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
                  WHERE pt.name = 'contract_extensions'
                    AND pc.name = 'original_contract_id'
                    AND rt.name = 'rental_contracts';

                  IF @fkOriginal IS NOT NULL
                      EXEC('ALTER TABLE contract_extensions DROP CONSTRAINT [' + @fkOriginal + ']');

                  IF NOT EXISTS (
                      SELECT 1
                      FROM sys.foreign_keys fk
                      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                      JOIN sys.tables pt ON fkc.parent_object_id = pt.object_id
                      JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
                      JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
                      WHERE pt.name = 'contract_extensions'
                        AND pc.name = 'original_contract_id'
                        AND rt.name = 'contracts'
                  )
                      ALTER TABLE contract_extensions WITH CHECK
                      ADD CONSTRAINT FK_contract_extensions_contracts_original_contract_id
                      FOREIGN KEY (original_contract_id) REFERENCES contracts(contract_id);
              END;",
            @"IF OBJECT_ID('contract_extensions', 'U') IS NOT NULL
              BEGIN
                  DECLARE @fkNew NVARCHAR(128);
                  SELECT TOP 1 @fkNew = fk.name
                  FROM sys.foreign_keys fk
                  JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                  JOIN sys.tables pt ON fkc.parent_object_id = pt.object_id
                  JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
                  JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
                  WHERE pt.name = 'contract_extensions'
                    AND pc.name = 'new_contract_id'
                    AND rt.name = 'rental_contracts';

                  IF @fkNew IS NOT NULL
                      EXEC('ALTER TABLE contract_extensions DROP CONSTRAINT [' + @fkNew + ']');

                  IF NOT EXISTS (
                      SELECT 1
                      FROM sys.foreign_keys fk
                      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                      JOIN sys.tables pt ON fkc.parent_object_id = pt.object_id
                      JOIN sys.columns pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
                      JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
                      WHERE pt.name = 'contract_extensions'
                        AND pc.name = 'new_contract_id'
                        AND rt.name = 'contracts'
                  )
                      ALTER TABLE contract_extensions WITH CHECK
                      ADD CONSTRAINT FK_contract_extensions_contracts_new_contract_id
                      FOREIGN KEY (new_contract_id) REFERENCES contracts(contract_id);
              END;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'TerminatedAt') ALTER TABLE rental_contracts ADD TerminatedAt datetime2 NULL;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contracts') AND name = 'TerminationReason') ALTER TABLE rental_contracts ADD TerminationReason nvarchar(max) NULL;",
            "IF OBJECT_ID('subscriptions', 'U') IS NULL BEGIN CREATE TABLE subscriptions (subscription_id int IDENTITY(1,1) NOT NULL PRIMARY KEY, user_id int NOT NULL, [plan] nvarchar(50) NOT NULL, [status] nvarchar(50) NOT NULL CONSTRAINT DF_subscriptions_status DEFAULT N'Pending', start_date datetime2 NULL, end_date datetime2 NULL, transaction_reference nvarchar(100) NULL, CONSTRAINT FK_subscriptions_users FOREIGN KEY (user_id) REFERENCES users(user_id)); END;",
            "IF OBJECT_ID('subscription_packages', 'U') IS NULL BEGIN CREATE TABLE subscription_packages (package_id int IDENTITY(1,1) NOT NULL PRIMARY KEY, name nvarchar(100) NOT NULL, price decimal(15,2) NOT NULL, description nvarchar(max) NULL, duration_months int NOT NULL CONSTRAINT DF_subscription_packages_duration_months DEFAULT 1, is_active bit NOT NULL CONSTRAINT DF_subscription_packages_is_active DEFAULT 1, created_at datetime2 NOT NULL CONSTRAINT DF_subscription_packages_created_at DEFAULT (getdate()), updated_at datetime2 NOT NULL CONSTRAINT DF_subscription_packages_updated_at DEFAULT (getdate())); END;",
            // Patch: thêm cột giới hạn cho subscription_packages (nếu bảng đã tồn tại nhưng thiếu cột)
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('subscription_packages') AND name = 'max_warehouses') ALTER TABLE subscription_packages ADD max_warehouses int NOT NULL DEFAULT 1;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('subscription_packages') AND name = 'max_staff_per_warehouse') ALTER TABLE subscription_packages ADD max_staff_per_warehouse int NOT NULL DEFAULT 5;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('subscription_packages') AND name = 'max_zones_per_warehouse') ALTER TABLE subscription_packages ADD max_zones_per_warehouse int NOT NULL DEFAULT 3;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('subscription_packages') AND name = 'max_total_area') ALTER TABLE subscription_packages ADD max_total_area decimal(18,2) NOT NULL DEFAULT 500;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('subscription_packages') AND name = 'allow_equipment_management') ALTER TABLE subscription_packages ADD allow_equipment_management bit NOT NULL DEFAULT 0;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('task_types') AND name = 'is_manual') ALTER TABLE task_types ADD is_manual bit NOT NULL CONSTRAINT DF_task_types_is_manual DEFAULT 0;",
            // Patch: Thêm cột xác minh hàng hóa thực tế cho nhân viên kho
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('inventory_items') AND name = 'verified_quantity') ALTER TABLE inventory_items ADD verified_quantity INT NULL;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('inventory_items') AND name = 'verify_note') ALTER TABLE inventory_items ADD verify_note NVARCHAR(500) NULL;",
            // Patch: Thêm cột retry tracking cho rental_payments
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_payments') AND name = 'RetryCount') ALTER TABLE rental_payments ADD RetryCount INT NOT NULL DEFAULT 0;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_payments') AND name = 'MaxRetry') ALTER TABLE rental_payments ADD MaxRetry INT NOT NULL DEFAULT 3;",
            "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_payments') AND name = 'LastRetryAt') ALTER TABLE rental_payments ADD LastRetryAt DATETIME2 NULL;",
            // Patch: Cập nhật dữ liệu chuẩn cho các gói (Basic vs Premium)
            "UPDATE subscription_packages SET max_warehouses = 1, max_staff_per_warehouse = 5, max_zones_per_warehouse = 3, max_total_area = 500, allow_equipment_management = 0 WHERE name = 'Basic';",
            "UPDATE subscription_packages SET max_warehouses = 5, max_staff_per_warehouse = 50, max_zones_per_warehouse = 10, max_total_area = 5000, allow_equipment_management = 1 WHERE name = 'Premium';",
        };
        foreach (var sql in patchSqls)
        {
            context.Database.ExecuteSqlRaw(sql);
        }

        // Emergency schema safeguard: if patch execution is skipped/failed mid-way, ensure subscriptions still exists.
        var connString = builder.Configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(connString))
        {
            using var conn = new SqlConnection(connString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
IF OBJECT_ID(N'dbo.subscriptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.subscriptions (
        subscription_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        [plan] NVARCHAR(50) NOT NULL,
        [status] NVARCHAR(50) NOT NULL CONSTRAINT DF_subscriptions_status DEFAULT N'Pending',
        start_date DATETIME2 NULL,
        end_date DATETIME2 NULL,
        transaction_reference NVARCHAR(100) NULL
    );

    IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.subscriptions
        ADD CONSTRAINT FK_subscriptions_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id);
    END
END;";
            cmd.ExecuteNonQuery();
        }

        logger.LogInformation("Database migrations applied successfully.");

        // 2. Seed the database
        DatabaseSeeder.Seed(context);
        logger.LogInformation("Database seeded successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database: {Message}", ex.Message);
        // We log the error but allow the application to continue starting
        logger.LogWarning(ex, "⚠️ DatabaseSeeder gặp lỗi (có thể data đã tồn tại hoặc SQL Server chưa sẵn sàng). Backend vẫn tiếp tục chạy.");
    }
}

// ==========================================
// 3. Configure the HTTP request pipeline
// ==========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// Cho phép public access file tĩnh (cho hình ảnh, avatar trong wwwroot)
app.UseStaticFiles();

// Mapping thêm thư mục uploads ở ngoài wwwroot (nơi lưu ảnh kho)
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Middleware order is important
app.UseAuthentication();
app.UseAuthorization();

// Hangfire Dashboard (with authorization)
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() },
    DashboardTitle = "OWRMS Background Jobs"
});

app.MapControllers();

app.MapHub<NotificationHub>("/hubs/notifications");

// Configure Hangfire Recurring Jobs
RecurringJob.AddOrUpdate<ContractNotificationJob>(
    "contract-expiry-notifications",
    job => job.SendExpiryNotifications(),
    "0 9 * * *",  // Run daily at 9 AM UTC
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

RecurringJob.AddOrUpdate<ContractNotificationJob>(
    "payment-reminders",
    job => job.SendPaymentReminders(),
    "0 */6 * * *",  // Run every 6 hours
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

// Tạm vô hiệu hóa contract expiry job để fix API trước
// RecurringJob.AddOrUpdate<ContractExpiryJob>(
//     "process-contract-expiries",
//     job => job.ProcessAllExpiries(),
//     "*/30 * * * *",  // Run every 30 minutes
//     new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

// Subscription expiry check — chạy hàng ngày lúc 0:00 UTC
RecurringJob.AddOrUpdate<SubscriptionExpiryJob>(
    "subscription-expiry-check",
    job => job.ProcessExpiries(),
    "0 0 * * *",  // Run daily at midnight UTC
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

app.Run();
