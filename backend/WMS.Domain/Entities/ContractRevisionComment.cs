namespace WMS.Domain.Entities;

public class ContractRevisionComment
{
    public int CommentId { get; set; }
    public int ThreadId { get; set; }
    public int UserId { get; set; }
    public string Message { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    public virtual ContractRevisionThread Thread { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
