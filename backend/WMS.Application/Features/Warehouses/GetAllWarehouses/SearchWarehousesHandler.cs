using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetAllWarehouses;

public class SearchWarehousesHandler
    : IRequestHandler<SearchWarehousesQuery, SearchWarehouseResult>
{
    private readonly IWarehouseRepository _repository;
    private readonly IRatingRepository    _ratingRepository;

    public SearchWarehousesHandler(
        IWarehouseRepository repository,
        IRatingRepository ratingRepository)
    {
        _repository        = repository;
        _ratingRepository  = ratingRepository;
    }

    public async Task<SearchWarehouseResult> Handle(
        SearchWarehousesQuery request,
        CancellationToken cancellationToken)
    {
        // ── 1. Lấy toàn bộ kho APPROVED ───────────────────────────
        var all = await _repository.GetApprovedWarehousesAsync(int.MaxValue, cancellationToken);

        var query = all.AsEnumerable();

        // ── 2. Lọc theo Tỉnh/Thành phố ────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.Province))
        {
            query = query.Where(w =>
                w.Address.Contains(request.Province, StringComparison.OrdinalIgnoreCase));
        }

        // ── 3. Lọc theo Quận/Huyện ────────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.District))
        {
            query = query.Where(w =>
                w.Address.Contains(request.District, StringComparison.OrdinalIgnoreCase));
        }

        // ── 4. Lọc theo Loại kho ──────────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.WarehouseType)
            && request.WarehouseType != "all")
        {
            query = query.Where(w =>
                (w.WarehouseType?.Equals(request.WarehouseType, StringComparison.OrdinalIgnoreCase) == true));
        }

        // ── 5. Lọc theo Diện tích (fix: dùng AvailableArea thay TotalArea) ──
        if (request.MinArea.HasValue)
            query = query.Where(w => w.AvailableArea >= request.MinArea.Value);
        if (request.MaxArea.HasValue)
            query = query.Where(w => w.AvailableArea <= request.MaxArea.Value);

        // ── 6. Lọc theo Khoảng giá ────────────────────────────────
        if (request.MinPrice.HasValue)
            query = query.Where(w => w.PricePerM2.HasValue && w.PricePerM2 >= request.MinPrice.Value);
        if (request.MaxPrice.HasValue)
            query = query.Where(w => w.PricePerM2.HasValue && w.PricePerM2 <= request.MaxPrice.Value);

        // ── 7. Lọc kho 24/7 ──────────────────────────────────────
        if (request.Is24Hours == true)
            query = query.Where(w => w.Is24HoursAccess);

        // ── 8. Sắp xếp (trước khi lọc rating vì cần count) ───────
        var list = (request.SortBy switch
        {
            "area_asc"   => query.OrderBy(w => w.TotalArea),
            "area_desc"  => query.OrderByDescending(w => w.TotalArea),
            "price_asc"  => query.OrderBy(w => w.PricePerM2 ?? decimal.MaxValue),
            "price_desc" => query.OrderByDescending(w => w.PricePerM2 ?? decimal.MinValue),
            _            => query.OrderByDescending(w => w.CreatedAt)
        }).ToList();

        // ── 9. Tính rating cho từng kho (batch) ───────────────────
        // Lấy tất cả ratings rồi group trong memory — tránh N+1 query
        var ratingByWarehouse = new Dictionary<int, (double avg, int count)>();
        try
        {
            var allRatings = await _ratingRepository.GetAllAsync(cancellationToken);
            ratingByWarehouse = allRatings
                .Where(r => r.IsHidden != true)
                .GroupBy(r => r.WarehouseId)
                .ToDictionary(
                    g => g.Key,
                    g => (avg: g.Average(r => (double)r.Star), count: g.Count())
                );
        }
        catch (Exception ex)
        {
            // Nếu lỗi DB (ví dụ thiếu cột schema), bỏ qua rating nhưng không làm crash kết quả tìm kiếm kho
            Console.WriteLine($"Warning: Could not fetch ratings for search results: {ex.Message}");
        }

        // ── 10. Lọc theo đánh giá tối thiểu ──────────────────────
        if (request.MinRating.HasValue)
        {
            list = list.Where(w =>
            {
                if (!ratingByWarehouse.TryGetValue(w.WarehouseId, out var stats))
                    return false; // Kho chưa có rating → không đáp ứng
                return stats.avg >= request.MinRating.Value;
            }).ToList();
        }

        var total = list.Count;

        // ── 11. Phân trang + chọn DTO ──────────────────────────────
        var items = list
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(w =>
            {
                ratingByWarehouse.TryGetValue(w.WarehouseId, out var rStats);
                return new ApprovedWarehouseDto
                {
                    WarehouseId     = w.WarehouseId,
                    Name            = w.Name,
                    Address         = w.Address,
                    Description     = w.Description,
                    TotalArea       = w.TotalArea,
                    AvailableArea   = w.AvailableArea,
                    ImageUrl        = w.Images.FirstOrDefault()?.MediaUrl,
                    CreatedAt       = w.CreatedAt ?? DateTime.UtcNow,
                    PricePerM2      = w.PricePerM2,
                    WarehouseType   = w.WarehouseType,
                    Is24HoursAccess = w.Is24HoursAccess,
                    OperatingHours  = w.OperatingHours,
                    AverageRating   = rStats.count > 0 ? Math.Round(rStats.avg, 1) : null,
                    RatingCount     = rStats.count,
                };
            })
            .ToList();

        return new SearchWarehouseResult
        {
            Total    = total,
            Page     = request.Page,
            PageSize = request.PageSize,
            Items    = items
        };
    }
}
