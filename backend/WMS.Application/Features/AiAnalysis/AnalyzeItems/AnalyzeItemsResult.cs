namespace WMS.Application.Features.AiAnalysis.AnalyzeItems;

// ── Output DTOs ─────────────────────────────────────────────────────────────

/// <summary>Toàn bộ kết quả trả về cho client sau khi phân tích AI.</summary>
public record AnalyzeItemsResult(
    int SessionId,
    List<DetectedItemDto> Items,
    double TotalVolumeM3,
    string SuggestedWarehouseType,
    string? SpecialNotes,
    double Confidence,
    List<SuggestedWarehouseDto> SuggestedWarehouses
);

/// <summary>Một đồ vật AI nhận dạng.</summary>
public record DetectedItemDto(
    string Name,
    int Quantity,
    double EstimatedVolumeM3
);

/// <summary>Thông tin kho gợi ý cho người dùng.</summary>
public record SuggestedWarehouseDto(
    int WarehouseId,
    string Name,
    string Address,
    string? WarehouseType,
    double TotalArea,
    double AvailableArea,
    double? AvailableVolume,
    decimal? PricePerM2,
    bool Is24HoursAccess,
    string? OperatingHours,
    double? AverageRating,
    int RatingCount,
    string? ImageUrl,
    double? Lat,
    double? Lng,
    string MatchReason   // Lý do AI gợi ý kho này
);
