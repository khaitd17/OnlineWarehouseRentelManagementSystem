using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;

namespace WMS.Infrastructure.Services;

public class EmailQueueBackgroundService : BackgroundService
{
    private readonly IEmailQueue _emailQueue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailQueueBackgroundService> _logger;

    public EmailQueueBackgroundService(
        IEmailQueue emailQueue,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailQueueBackgroundService> logger)
    {
        _emailQueue = emailQueue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in _emailQueue.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                await emailService.SendInfo(
                    message.ToEmail,
                    message.ToName,
                    message.Subject,
                    message.HtmlContent);

                _logger.LogInformation("Queued email sent to {Email} with subject {Subject}.", message.ToEmail, message.Subject);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send queued email to {Email} with subject {Subject}.", message.ToEmail, message.Subject);
            }
        }
    }
}
