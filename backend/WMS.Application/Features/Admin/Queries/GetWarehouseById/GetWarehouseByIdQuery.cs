using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetWarehouseById;

public record GetWarehouseByIdQuery(int Id) : IRequest<ApiResponse<WarehouseDetailDto>>;

public record WarehouseDetailDto(
    int WarehouseId,
    int OwnerId,
    string Name,
    string Address,
    double? Lat,
    double? Lng,
    string? Description,
    double TotalArea,
    double AvailableArea,
    string? OperatingHours,
    string? Status,
    DateTime? CreatedAt,
    DateTime? UpdatedAt,
    DateTime? ApprovedAt,
    int? ApprovedBy,
    string? ApprovedByName,
    string? RejectionReason,
    string OwnerName,
    string OwnerEmail,
    List<WarehouseMediaDto> Media
);

public record WarehouseMediaDto(
    int MediaId,
    string MediaUrl,
    string MediaType,
    int? DisplayOrder,
    bool? IsPrimary
);
