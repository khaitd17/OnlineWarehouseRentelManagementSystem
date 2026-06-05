using System.Threading.Channels;
using WMS.Application.Interfaces;

namespace WMS.Infrastructure.Services;

public class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailQueueMessage> _channel;

    public EmailQueue()
    {
        _channel = Channel.CreateBounded<EmailQueueMessage>(new BoundedChannelOptions(200)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public ValueTask QueueAsync(EmailQueueMessage message, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message.ToEmail))
            throw new ArgumentException("Email người nhận không được để trống.", nameof(message));

        return _channel.Writer.WriteAsync(message, cancellationToken);
    }

    public IAsyncEnumerable<EmailQueueMessage> ReadAllAsync(CancellationToken cancellationToken = default)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
