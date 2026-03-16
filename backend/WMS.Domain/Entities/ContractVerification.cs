namespace WMS.Domain.Entities;

public class ContractVerification
{
    public int VerificationId { get; set; }
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public string OtpCode { get; set; } = null!;
    public bool IsVerified { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
}
