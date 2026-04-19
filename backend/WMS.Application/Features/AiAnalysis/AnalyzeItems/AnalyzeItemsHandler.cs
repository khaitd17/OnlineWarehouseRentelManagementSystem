using System.Text.Json;
using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.AiAnalysis.AnalyzeItems;

/// <summary>
/// Handler phân tích ảnh đồ vật:
/// 1. Kiểm tra quota 10 lần/ngày
/// 2. Gọi Gemini Vision API
/// 3. Lưu session lịch sử
/// 4. Gợi ý kho phù hợp từ DB
/// </summary>
public class AnalyzeItemsHandler : IRequestHandler<AnalyzeItemsCommand, AnalyzeItemsResult>
{
    private readonly IGeminiService _geminiService;
    private readonly IAiAnalysisSessionRepository _sessionRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IRatingRepository _ratingRepo;

    private const int DailyQuota = 10;

    public AnalyzeItemsHandler(
        IGeminiService geminiService,
        IAiAnalysisSessionRepository sessionRepo,
        IWarehouseRepository warehouseRepo,
        IRatingRepository ratingRepo)
    {
        _geminiService = geminiService;
        _sessionRepo = sessionRepo;
        _warehouseRepo = warehouseRepo;
        _ratingRepo = ratingRepo;
    }

    public async Task<AnalyzeItemsResult> Handle(
        AnalyzeItemsCommand request,
        CancellationToken cancellationToken)
    {
        // ── 1. Kiểm tra quota hàng ngày ──────────────────────────────
        var todayCount = await _sessionRepo.CountTodayAsync(request.UserId, cancellationToken);
        if (todayCount >= DailyQuota)
            throw new InvalidOperationException(
                $"Bạn đã sử dụng hết {DailyQuota} lượt phân tích AI trong hôm nay. Vui lòng thử lại vào ngày mai.");

        // ── 2. Đọc bytes của từng ảnh ────────────────────────────────
        var imageBytes = new List<byte[]>();
        foreach (var file in request.Images)
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);
            imageBytes.Add(ms.ToArray());
        }

        // ── 3. Gọi Gemini Vision API ─────────────────────────────────
        var geminiResult = await _geminiService.AnalyzeItemsAsync(imageBytes, cancellationToken);

        // ── 4. Lưu lịch sử phân tích vào DB ─────────────────────────
        var resultJson = JsonSerializer.Serialize(geminiResult);
        var session = await _sessionRepo.AddAsync(new AiAnalysisSession
        {
            UserId = request.UserId,
            ResultJson = resultJson,
            EstimatedVolumeM3 = geminiResult.TotalVolumeM3,
            SuggestedType = geminiResult.SuggestedWarehouseType,
            SpecialNotes = geminiResult.SpecialNotes,
            Confidence = geminiResult.Confidence
        }, cancellationToken);

        // ── 5. Query kho phù hợp ─────────────────────────────────────
        var allWarehouses = await _warehouseRepo.GetApprovedWarehousesAsync(int.MaxValue, cancellationToken);

        var filtered = allWarehouses.AsEnumerable();

        // Lọc theo tỉnh/huyện nếu user chỉ định
        if (!string.IsNullOrWhiteSpace(request.PreferredProvince))
            filtered = filtered.Where(w =>
                w.Address.Contains(request.PreferredProvince, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(request.PreferredDistrict))
            filtered = filtered.Where(w =>
                w.Address.Contains(request.PreferredDistrict, StringComparison.OrdinalIgnoreCase));

        // Ưu tiên kho có AvailableVolume đủ chứa đồ;
        // nếu không có volume info, fallback sang kho có AvailableArea lớn
        var neededVolume = geminiResult.TotalVolumeM3;

        // Kho phù hợp: có volume đủ HOẶC không có volume nhưng AvailableArea ≥ needM2 estimate
        var estimatedAreaNeeded = Math.Max(neededVolume * 2.0, 5.0); // rough m2 estimate

        var suitable = filtered.Where(w =>
            (w.AvailableVolume.HasValue && w.AvailableVolume.Value >= neededVolume)
            || (!w.AvailableVolume.HasValue && w.AvailableArea >= estimatedAreaNeeded)
        ).ToList();

        // Nếu không đủ kho phù hợp, lấy top kho theo AvailableArea lớn nhất
        if (suitable.Count < 3)
        {
            suitable = filtered
                .OrderByDescending(w => w.AvailableVolume ?? w.AvailableArea * 3)
                .Take(5)
                .ToList();
        }

        // Tính rating
        var ratingMap = new Dictionary<int, (double avg, int count)>();
        try
        {
            var allRatings = await _ratingRepo.GetAllAsync(cancellationToken);
            ratingMap = allRatings
                .Where(r => r.IsHidden != true)
                .GroupBy(r => r.WarehouseId)
                .ToDictionary(g => g.Key, g => (avg: g.Average(r => (double)r.Star), count: g.Count()));
        }
        catch { /* Bỏ qua nếu lỗi, vẫn trả kho */ }

        // Sắp xếp: ưu tiên khớp type → rating → price
        var suggestedWarehouses = suitable
            .OrderByDescending(w =>
            {
                var typeMatch = w.WarehouseType != null &&
                    w.WarehouseType.Contains(geminiResult.SuggestedWarehouseType,
                        StringComparison.OrdinalIgnoreCase) ? 2 : 0;
                ratingMap.TryGetValue(w.WarehouseId, out var r);
                return typeMatch + (r.count > 0 ? r.avg : 0);
            })
            .Take(5)
            .Select(w =>
            {
                ratingMap.TryGetValue(w.WarehouseId, out var rStats);
                var typeMatches = w.WarehouseType != null &&
                    w.WarehouseType.Contains(geminiResult.SuggestedWarehouseType,
                        StringComparison.OrdinalIgnoreCase);

                var reason = typeMatches
                    ? $"Loại kho phù hợp ({w.WarehouseType}) và đủ không gian"
                    : "Còn đủ không gian để chứa đồ của bạn";

                return new SuggestedWarehouseDto(
                    WarehouseId: w.WarehouseId,
                    Name: w.Name,
                    Address: w.Address,
                    WarehouseType: w.WarehouseType,
                    TotalArea: w.TotalArea,
                    AvailableArea: w.AvailableArea,
                    AvailableVolume: w.AvailableVolume,
                    PricePerM2: w.PricePerM2,
                    Is24HoursAccess: w.Is24HoursAccess,
                    OperatingHours: w.OperatingHours,
                    AverageRating: rStats.count > 0 ? Math.Round(rStats.avg, 1) : null,
                    RatingCount: rStats.count,
                    ImageUrl: w.Images.FirstOrDefault()?.MediaUrl,
                    Lat: w.Lat,
                    Lng: w.Lng,
                    MatchReason: reason
                );
            })
            .ToList();

        // ── 6. Build kết quả trả về ──────────────────────────────────
        return new AnalyzeItemsResult(
            SessionId: session.SessionId,
            Items: geminiResult.Items.Select(i =>
                new DetectedItemDto(i.Name, i.Quantity, i.EstimatedVolumeM3, i.WidthM, i.LengthM, i.HeightM)).ToList(),
            TotalVolumeM3: geminiResult.TotalVolumeM3,
            SuggestedWarehouseType: geminiResult.SuggestedWarehouseType,
            SpecialNotes: geminiResult.SpecialNotes,
            Confidence: geminiResult.Confidence,
            SuggestedWarehouses: suggestedWarehouses
        );
    }
}
