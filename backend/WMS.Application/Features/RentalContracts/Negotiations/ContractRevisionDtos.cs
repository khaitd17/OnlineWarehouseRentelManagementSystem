namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ContractRevisionCommentDto
{
    public int CommentId { get; set; }
    public int ThreadId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string Message { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class ContractRevisionThreadDto
{
    public int ThreadId { get; set; }
    public int ContractId { get; set; }
    public string Section { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int CreatedBy { get; set; }
    public string CreatedByName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? ResolvedBy { get; set; }
    public string? ResolvedByName { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<ContractRevisionCommentDto> Comments { get; set; } = new();
}
