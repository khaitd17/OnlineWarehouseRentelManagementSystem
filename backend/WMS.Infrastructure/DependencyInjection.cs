using Microsoft.Extensions.DependencyInjection;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Repositories;

namespace WMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();

        return services;
    }
}