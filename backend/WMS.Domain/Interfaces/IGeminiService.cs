namespace WMS.Domain.Interfaces;

/// <summary>
/// Contract cho service gọi Gemini Vision API để phân tích ảnh đồ vật.
/// </summary>
public interface IGeminiService
{
    /// <summary>
    /// Gửi danh sách ảnh (bytes) đến Gemini và nhận kết quả phân tích.
    /// </summary>
    /// <param name="imageBytes">Danh sách bytes của từng ảnh (tối đa 5).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<GeminiAnalysisResult> AnalyzeItemsAsync(
        List<byte[]> imageBytes,
        CancellationToken cancellationToken);
}

/// <summary>Kết quả phân tích từ Gemini Vision API.</summary>
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
    double EstimatedVolumeM3
);
