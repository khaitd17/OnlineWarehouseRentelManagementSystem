namespace WMS.Application.Interfaces;

public record EmailQueueMessage(
    string ToEmail,
    string ToName,
    string Subject,
    string HtmlContent);

public interface IEmailQueue
{
    ValueTask QueueAsync(EmailQueueMessage message, CancellationToken cancellationToken = default);
    IAsyncEnumerable<EmailQueueMessage> ReadAllAsync(CancellationToken cancellationToken = default);
}
