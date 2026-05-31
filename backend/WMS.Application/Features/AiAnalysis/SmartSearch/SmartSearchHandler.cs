using System.Text.Json;
using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.AiAnalysis.SmartSearch;

/// <summary>
/// Handler tìm kiếm kho thông minh:
/// 1. Kiểm tra quota
/// 2. Load tất cả kho + ratings
/// 3. Gọi Gemini SmartSearch
/// 4. Lưu session + trả kết quả
/// </summary>
public class SmartSearchHandler : IRequestHandler<SmartSearchCommand, SmartSearchResult>
{
    private readonly IGeminiService _geminiService;
    private readonly IAiAnalysisSessionRepository _sessionRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IRatingRepository _ratingRepo;

    private const int DailyQuota = 10;

    public SmartSearchHandler(
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

    public async Task<SmartSearchResult> Handle(
        SmartSearchCommand request,
        CancellationToken cancellationToken)
    {
        // ── 1. Kiểm tra quota (bỏ qua cho guest) ──────────────────────────────
        if (request.UserId > 0)
        {
            var todayCount = await _sessionRepo.CountTodayAsync(request.UserId, cancellationToken);
            if (todayCount >= DailyQuota)
                throw new InvalidOperationException(
                    $"Bạn đã sử dụng hết {DailyQuota} lượt AI trong hôm nay. Vui lòng thử lại vào ngày mai.");
        }

        // ── 2. Load tất cả kho đã approved ─────────────────────────
        var allWarehouses = await _warehouseRepo.GetApprovedWarehousesAsync(int.MaxValue, cancellationToken);

        // ── 3. Load ratings ────────────────────────────────────────
        var ratingMap = new Dictionary<int, (double avg, int count)>();
        try
        {
            var allRatings = await _ratingRepo.GetAllAsync(cancellationToken);
            ratingMap = allRatings
                .Where(r => r.IsHidden != true)
                .GroupBy(r => r.WarehouseId)
                .ToDictionary(g => g.Key, g => (avg: g.Average(r => (double)r.Star), count: g.Count()));
        }
        catch { /* Bỏ qua nếu lỗi */ }

        // ── 4. Build WarehouseSearchData list ───────────────────────
        var searchData = allWarehouses.Select(w =>
        {
            ratingMap.TryGetValue(w.WarehouseId, out var rStats);
            double? distKm = null;
            if (request.Lat.HasValue && request.Lng.HasValue && w.Lat.HasValue && w.Lng.HasValue)
                distKm = Math.Round(GetDistance(request.Lat.Value, request.Lng.Value, w.Lat.Value, w.Lng.Value), 1);

            return new WarehouseSearchData(
                WarehouseId: w.WarehouseId,
                Name: w.Name,
                Address: w.Address,
                WarehouseType: w.WarehouseType,
                TotalArea: w.TotalArea,
                AvailableArea: w.AvailableArea,
                PricePerM2: w.PricePerM2,
                Is24HoursAccess: w.Is24HoursAccess,
                OperatingHours: w.OperatingHours,
                Lat: w.Lat,
                Lng: w.Lng,
                AverageRating: rStats.count > 0 ? Math.Round(rStats.avg, 1) : null,
                RatingCount: rStats.count,
                Description: w.Description,
                DistanceKm: distKm
            );
        }).ToList();

        // ── 5. Gọi Gemini SmartSearch ──────────────────────────────
        var geminiResult = await _geminiService.SmartSearchAsync(
            request.Prompt, searchData, cancellationToken);

        // ── 6. Lưu session (bỏ qua cho guest) ───────────────────────────────
        var sessionId = 0;
        if (request.UserId > 0)
        {
            var session = await _sessionRepo.AddAsync(new AiAnalysisSession
            {
                UserId = request.UserId,
                SessionType = "SMART_SEARCH",
                UserPrompt = request.Prompt,
                ResultJson = JsonSerializer.Serialize(geminiResult),
                Confidence = geminiResult.RankedWarehouses.Any()
                    ? geminiResult.RankedWarehouses.Average(r => r.MatchScore)
                    : 0,
            }, cancellationToken);
            sessionId = session.SessionId;
        }

        // ── 7. Map AI results → full warehouse DTOs ────────────────
        var warehouseLookup = allWarehouses.ToDictionary(w => w.WarehouseId);
        var resultWarehouses = geminiResult.RankedWarehouses
            .Where(r => warehouseLookup.ContainsKey(r.WarehouseId))
            .Select(r =>
            {
                var w = warehouseLookup[r.WarehouseId];
                ratingMap.TryGetValue(w.WarehouseId, out var rStats);
                var sd = searchData.First(s => s.WarehouseId == w.WarehouseId);

                return new SmartSearchWarehouseDto(
                    WarehouseId: w.WarehouseId,
                    Name: w.Name,
                    Address: w.Address,
                    WarehouseType: w.WarehouseType,
                    TotalArea: w.TotalArea,
                    AvailableArea: w.AvailableArea,
                    PricePerM2: w.PricePerM2,
                    Is24HoursAccess: w.Is24HoursAccess,
                    OperatingHours: w.OperatingHours,
                    ImageUrl: w.Images.FirstOrDefault()?.MediaUrl,
                    Lat: w.Lat,
                    Lng: w.Lng,
                    AverageRating: rStats.count > 0 ? Math.Round(rStats.avg, 1) : null,
                    RatingCount: rStats.count,
                    DistanceKm: sd.DistanceKm,
                    Rank: r.Rank,
                    MatchScore: r.MatchScore,
                    Explanation: r.Explanation,
                    Pros: r.Pros,
                    Cons: r.Cons
                );
            })
            .OrderBy(w => w.Rank)
            .ToList();

        return new SmartSearchResult(
            SessionId: sessionId,
            AiSummary: geminiResult.AiSummary,
            Warehouses: resultWarehouses,
            FollowUpSuggestions: geminiResult.FollowUpSuggestions
        );
    }

    private static double GetDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var r = 6371;
        var dLat = Math.PI * (lat2 - lat1) / 180.0;
        var dLon = Math.PI * (lon2 - lon1) / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(Math.PI * lat1 / 180.0) * Math.Cos(Math.PI * lat2 / 180.0) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return r * c;
    }
}
