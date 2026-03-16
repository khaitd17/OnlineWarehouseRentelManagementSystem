using FluentValidation;
using MediatR;
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
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// MediatR Registration - scan tất cả handlers trong Application assembly
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblies(
        typeof(RegisterCommand).Assembly,
        typeof(ApplicationDbContext).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
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

// Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPasswordGenerator, PasswordGenerator>();

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
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});
builder.Services.AddAuthorization();


// ==========================================
// 2. Build the Application
// ==========================================

var app = builder.Build();

// Role seeding disabled — data already exists in DB, EF mapping causes SqlException
// using (var scope = app.Services.CreateScope())
// {
//     var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
//     if (!context.Roles.Any())
//     {
//         context.Roles.AddRange(
//             new WMS.Domain.Entities.Role { RoleName = "RENTER", Description = "Khách thuê" },
//             new WMS.Domain.Entities.Role { RoleName = "OWNER",  Description = "Chủ kho" },
//             new WMS.Domain.Entities.Role { RoleName = "STAFF",  Description = "Nhân viên" },
//             new WMS.Domain.Entities.Role { RoleName = "ADMIN",  Description = "Quản trị viên" }
//         );
//         context.SaveChanges();
//     }
// }
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // Gọi DatabaseSeeder để khởi tạo dữ liệu mẫu
    DatabaseSeeder.Seed(context);
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

app.MapControllers();

app.Run();