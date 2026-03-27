using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetWarehouseDetail;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetWarehouseDetailHandler : IRequestHandler<GetWarehouseDetailQuery, ApiResponse<WarehouseDetailDto>>
{
    private readonly ApplicationDbContext _db;

    public GetWarehouseDetailHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<WarehouseDetailDto>> Handle(GetWarehouseDetailQuery request, CancellationToken cancellationToken)
    {
        var warehouse = await _db.Warehouses
            .Include(w => w.Owner)
            .Include(w => w.ApprovedByNavigation)
            .Include(w => w.WarehouseMedia)
            .Include(w => w.Ratings)
            .FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);

        if (warehouse == null)
        {
            return ApiResponse<WarehouseDetailDto>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");
        }

        var ownerInfo = new OwnerInfoDto(
            warehouse.Owner.UserId, warehouse.Owner.FullName,
            warehouse.Owner.Email, warehouse.Owner.Phone);

        var media = warehouse.WarehouseMedia
            .OrderBy(m => m.DisplayOrder)
            .Select(m => new WarehouseMediaDto(m.MediaId, m.MediaUrl, m.MediaType, m.DisplayOrder, m.IsPrimary))
            .ToList();

        // Try to load documents if the table exists
        var documents = new List<WarehouseDocumentDto>();
        try
        {
            var docs = await _db.WarehouseDocuments
                .Include(d => d.VerifiedByNavigation)
                .Where(d => d.WarehouseId == warehouse.WarehouseId)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync(cancellationToken);

            documents = docs.Select(d => new WarehouseDocumentDto(
                d.DocumentId, d.DocumentType, d.DocumentUrl, d.DocumentNumber,
                d.IssuedDate, d.ExpiryDate, d.Status,
                d.VerifiedByNavigation?.FullName, d.VerifiedAt,
                d.RejectionReason, d.CreatedAt)).ToList();
        }
        catch
        {
            // Table may not exist yet — skip documents
        }

        var visibleRatings = warehouse.Ratings.Where(r => r.IsHidden != true).ToList();
        var ratingSummary = new RatingSummaryDto(
            visibleRatings.Count > 0 ? visibleRatings.Average(r => r.Star) : null,
            visibleRatings.Count);

        var dto = new WarehouseDetailDto(
            warehouse.WarehouseId, warehouse.Name, warehouse.Address,
            warehouse.Lat, warehouse.Lng, warehouse.Description,
            warehouse.TotalArea, warehouse.AvailableArea, warehouse.PricePerM2,
            warehouse.OperatingHours, warehouse.Status,
            warehouse.CreatedAt, warehouse.UpdatedAt, warehouse.ApprovedAt,
            warehouse.ApprovedByNavigation?.FullName, warehouse.RejectionReason,
            warehouse.SubmissionType ?? "NEW",
            warehouse.PendingChangeNote,
            ownerInfo, media, documents, ratingSummary);


        return ApiResponse<WarehouseDetailDto>.SuccessResponse(dto, "Lấy chi tiết kho thành công.");
    }
}
