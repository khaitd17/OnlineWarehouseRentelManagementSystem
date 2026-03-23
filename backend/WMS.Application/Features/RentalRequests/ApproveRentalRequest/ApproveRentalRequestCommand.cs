using MediatR;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public class ApproveRentalRequestCommand : IRequest<int>
{
    public int RequestId { get; set; }
    public int ReviewerId { get; set; }
    public string? ContractImageUrl { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal? DepositAmount { get; set; }
    public string? Terms { get; set; }
    public DateTime? StartDate { get; set; }
    public int? DurationMonths { get; set; }
    // Note: OwnerSignatureBase64 removed - owner signs via separate endpoint after contract creation
}
