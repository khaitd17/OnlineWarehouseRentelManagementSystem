using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetWarehouseDetail;

public record GetWarehouseDetailQuery(int WarehouseId) : IRequest<ApiResponse<WarehouseDetailDto>>;

public record WarehouseDetailDto(
    int WarehouseId,
    string Name,
    string Address,
    double? Lat,
    double? Lng,
    string? Description,
    string? WarehouseType,
    double TotalArea,
    double AvailableArea,
    decimal? PricePerM2,
    string? OperatingHours,
    string? Status,
    DateTime? CreatedAt,
    DateTime? UpdatedAt,
    DateTime? ApprovedAt,
    string? ApprovedByName,
    string? RejectionReason,
    string SubmissionType,
    string? PendingChangeNote,
    OwnerInfoDto Owner,
    List<WarehouseMediaDto> Media,
    List<WarehouseDocumentDto> Documents,
    RatingSummaryDto RatingSummary
);

public record OwnerInfoDto(
    int UserId,
    string FullName,
    string Email,
    string? Phone
);

public record WarehouseMediaDto(
    int MediaId,
    string MediaUrl,
    string MediaType,
    int? DisplayOrder,
    bool? IsPrimary
);

public record WarehouseDocumentDto(
    int DocumentId,
    string DocumentType,
    string DocumentUrl,
    string? DocumentNumber,
    DateOnly? IssuedDate,
    DateOnly? ExpiryDate,
    string? Status,
    string? VerifiedByName,
    DateTime? VerifiedAt,
    string? RejectionReason,
    DateTime? CreatedAt
);

public record RatingSummaryDto(
    double? AverageRating,
    int TotalRatings
);
