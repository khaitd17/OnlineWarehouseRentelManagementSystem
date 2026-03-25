namespace WMS.Infrastructure.Services;

public class SepaySettings
{
    public string ApiToken { get; set; } = null!;
    public string BankName { get; set; } = null!;
    public string AccountNumber { get; set; } = null!;
    public string AccountName { get; set; } = null!;
    public string WebhookUrl { get; set; } = null!;
    public string WhitelistIPs { get; set; } = null!;

    public string[] GetWhitelistIpArray() =>
        WhitelistIPs?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        ?? Array.Empty<string>();
}
