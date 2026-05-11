using Microsoft.Extensions.DependencyInjection;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Repositories;
using WMS.Infrastructure.Services;
using WMS.Application.Common;

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
        services.AddScoped<IRatingRepository, RatingRepository>();
        services.AddScoped<IWarehouseReturnRepository, WarehouseReturnRepository>();
        services.AddScoped<IRentalPaymentRepository, RentalPaymentRepository>();
        services.AddScoped<IContractExtensionRepository, ContractExtensionRepository>();
        services.AddScoped<IEquipmentRepository, EquipmentRepository>();
        services.AddScoped<IEquipmentIncidentRepository, EquipmentIncidentRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IStaffMembershipRepository, StaffMembershipRepository>();
        services.AddScoped<IRentalAreaRepository, RentalAreaRepository>();
        services.AddScoped<ISepayService, SepayService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();

        // ── AI Analysis Feature ─────────────────────────────────────
        services.AddScoped<IAiAnalysisSessionRepository, AiAnalysisSessionRepository>();
        services.AddScoped<IGeminiService, GeminiService>();

        // ── Receipt Note (Phiếu nhập/xuất kho) ─────────────────────
        services.AddScoped<IReceiptNoteRepository, ReceiptNoteRepository>();

        // HttpClient cho Gemini API (timeout 60 giây vì xử lý ảnh lâu)
        services.AddHttpClient("Gemini", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
        });

        return services;
    }
}
