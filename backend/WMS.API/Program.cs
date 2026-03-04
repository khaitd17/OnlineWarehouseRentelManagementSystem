using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WMS.Application.Features.Auth.Register;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;
using WMS.Infrastructure.Repositories;
using WMS.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. Add Services to the container
// ==========================================

// Add Controllers
builder.Services.AddControllers();

// Swashbuckle/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "OWRMS API", Version = "v1" });
});

// Database Context - dùng ScaffoldModels DbContext (database-first)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// MediatR Registration - scan tất cả handlers trong Application assembly
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblies(typeof(RegisterCommand).Assembly);
});

// ---- Dependency Injection ----
// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IWarehouseRepository, WarehouseRepository>();

// Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();

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

builder.Services.AddAuthorization();

// CORS - cho phép frontend React (localhost:3000) gọi API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ==========================================
// 2. Build the Application
// ==========================================

var app = builder.Build();

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

// Middleware order is important
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();