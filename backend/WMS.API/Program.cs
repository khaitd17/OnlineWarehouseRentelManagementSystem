using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WMS.Application.Features.Warehouses.CreateWarehouse;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;
using WMS.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. Add Services to the container
// ==========================================

// Add Controllers
builder.Services.AddControllers();

// Swashbuckle/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Context (SQL Server)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// MediatR Registration
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblies(typeof(CreateWarehouseHandler).Assembly);
});

// Dependency Injection (Repositories)
builder.Services.AddScoped<IWarehouseRepository, WarehouseRepository>();
builder.Services.AddScoped<IRentalRequestRepository, RentalRequestRepository>();

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

app.UseHttpsRedirection();

// Middleware order is important
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();