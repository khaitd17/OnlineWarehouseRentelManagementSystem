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

    // ── Owner-assigned zone (when renter did not pick a zone) ──
    public double? AssignedPositionX { get; set; }
    public double? AssignedPositionY { get; set; }
    public double? AssignedWidth { get; set; }
    public double? AssignedLength { get; set; }
    public int? AssignedBaseAreaId { get; set; }

    // ── Extension zone (L-shaped: owner assigns primary + extension) ──
    public bool AssignedHasExtensionZone { get; set; } = false;
    public double? AssignedExtensionPositionX { get; set; }
    public double? AssignedExtensionPositionY { get; set; }
    public double? AssignedExtensionWidth { get; set; }
    public double? AssignedExtensionLength { get; set; }

    // ── Multi-zone (additional non-adjacent rectangles) ──
    public string? AssignedAdditionalZonesJson { get; set; }
}
