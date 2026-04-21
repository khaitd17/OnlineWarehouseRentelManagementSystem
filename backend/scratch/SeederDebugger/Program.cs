using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using WMS.Infrastructure.Persistence;
using System.IO;

var connectionString = "Server=localhost;Database=OWRMS;Trusted_Connection=True;TrustServerCertificate=True;";

var services = new ServiceCollection();
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

var serviceProvider = services.BuildServiceProvider();

using var scope = serviceProvider.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

Console.WriteLine("Starting manual seeding...");
try 
{
    DatabaseSeeder.Seed(context);
    Console.WriteLine("Seeding completed successfully!");
}
catch (Exception ex)
{
    Console.WriteLine($"SEEDING FAILED: {ex.Message}");
    Console.WriteLine(ex.StackTrace);
    if (ex.InnerException != null)
    {
        Console.WriteLine($"INNER: {ex.InnerException.Message}");
        Console.WriteLine(ex.InnerException.StackTrace);
    }
}
