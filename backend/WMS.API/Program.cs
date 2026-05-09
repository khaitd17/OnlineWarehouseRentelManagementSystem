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
builder.Services.AddScoped<WMS.Domain.Interfaces.IWarehouseGridLocationRepository, WMS.Infrastructure.Repositories.WarehouseGridLocationRepository>();

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
            DisableGlobalLocks = true,
            EnableHeavyMigrations = true,
            PrepareSchemaIfNecessary = true
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
            policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173")
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
        // 1. Apply Entity Framework migrations
        // We use Migrate instead of EnsureCreated to properly apply the schema changes
        // in dependency order. (Any conflicting manual migration files were removed).
        context.Database.Migrate();
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