namespace WMS.Domain.Entities;

public class OwnerContractTemplate
{
    public int TemplateId { get; set; }
    public int OwnerId { get; set; }
    public string TemplateName { get; set; } = null!;

    public bool UseBasicInfoSection { get; set; } = true;
    public bool UsePaymentSection { get; set; } = true;
    public bool UseViolationSection { get; set; } = true;
    public bool UseTerminationSection { get; set; } = true;
    public bool UseSignatureSection { get; set; } = true;

    public string? BasicInfoContent { get; set; }
    public string? PaymentContent { get; set; }
    public string? ViolationContent { get; set; }
    public string? TerminationContent { get; set; }
    public string? SignatureContent { get; set; }
    public string? AdditionalTermsContent { get; set; }

    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual User Owner { get; set; } = null!;
}
