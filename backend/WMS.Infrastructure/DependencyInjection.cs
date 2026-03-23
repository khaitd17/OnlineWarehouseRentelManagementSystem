using Microsoft.Extensions.DependencyInjection;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Repositories;

namespace WMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();

        services.AddScoped<IWarehouseMediaRepository, WarehouseMediaRepository>();

        services.AddScoped<IWarehouseDocumentRepository, WarehouseDocumentRepository>();

        services.AddScoped<IInventoryRequestRepository, InventoryRequestRepository>();

        services.AddScoped<IPaymentRepository, PaymentRepository>();

        return services;
    }
}