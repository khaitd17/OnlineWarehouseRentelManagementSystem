using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ApplyContractChangesCommand : IRequest<ApplyContractChangesResult>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal? DepositAmount { get; set; }
    public DateTime StartDate { get; set; }
    public int DurationMonths { get; set; }
    public string? Terms { get; set; }
    public int MonthsPerTerm { get; set; } = 1;
    public int AllowedOverdueDays { get; set; } = 7;
    public List<int>? ResolveThreadIds { get; set; }
}

public class ApplyContractChangesResult
{
    public int VersionNumber { get; set; }
    public string Status { get; set; } = null!;
}
