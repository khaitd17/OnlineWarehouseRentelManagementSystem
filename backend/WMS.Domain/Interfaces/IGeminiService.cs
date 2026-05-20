namespace WMS.Domain.Interfaces;

/// <summary>
/// Contract cho service gọi Gemini API.
/// </summary>
public interface IGeminiService
{
    /// <summary>
    /// Gửi danh sách ảnh (bytes) đến Gemini và nhận kết quả phân tích đồ vật.
    /// </summary>
    Task<GeminiAnalysisResult> AnalyzeItemsAsync(
        List<byte[]> imageBytes,
        CancellationToken cancellationToken);

    /// <summary>
    /// Tìm kiếm kho thông minh: gửi prompt người dùng + dữ liệu kho → Gemini phân tích & xếp hạng.
    /// </summary>
    Task<GeminiSmartSearchResult> SmartSearchAsync(
        string userPrompt,
        List<WarehouseSearchData> warehouses,
        CancellationToken cancellationToken);
}

/// <summary>Kết quả phân tích ảnh từ Gemini Vision API.</summary>
public record GeminiAnalysisResult(
    List<DetectedItem> Items,
    double TotalVolumeM3,
    string SuggestedWarehouseType,
    string? SpecialNotes,
    double Confidence
);

/// <summary>Một đồ vật được AI nhận dạng trong ảnh.</summary>
public record DetectedItem(
    string Name,
    int Quantity,
    double EstimatedVolumeM3,
    double WidthM,
    double LengthM,
    double HeightM
);

/// <summary>Kết quả tìm kiếm thông minh từ Gemini.</summary>
public record GeminiSmartSearchResult(
    List<RankedWarehouse> RankedWarehouses,
    string AiSummary,
    List<string> FollowUpSuggestions
);

/// <summary>Một kho được AI xếp hạng.</summary>
public record RankedWarehouse(
    int WarehouseId,
    int Rank,
    double MatchScore,
    string Explanation,
    List<string> Pros,
    List<string> Cons
);

/// <summary>Dữ liệu kho gửi cho Gemini để phân tích.</summary>
public record WarehouseSearchData(
    int WarehouseId,
    string Name,
    string Address,
    string? WarehouseType,
    double TotalArea,
    double AvailableArea,
    decimal? PricePerM2,
    bool Is24HoursAccess,
    string? OperatingHours,
    double? Lat,
    double? Lng,
    double? AverageRating,
    int RatingCount,
    string? Description,
    double? DistanceKm
);

