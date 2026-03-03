namespace WMS.Application.Features.RentalRequests.Common;

public record RentalRequestDto(
    int Id,
    int RenterId,
    int WarehouseId,
    string WarehouseName,
    double RequestedArea,
    int DurationMonths,
    string Status,
    string? Notes,
    DateTime CreatedAt,
    DateTime? ApprovedAt,
    DateTime? RejectedAt,
    string? RejectionReason,
    int? ReviewedBy
);
