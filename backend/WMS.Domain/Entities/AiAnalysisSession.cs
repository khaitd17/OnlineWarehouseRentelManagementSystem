using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

/// <summary>
/// Lưu lịch sử mỗi lần người dùng phân tích ảnh đồ vật bằng AI.
/// </summary>
public class AiAnalysisSession
{
    public int SessionId { get; set; }

    public int UserId { get; set; }

    public DateTime AnalyzedAt { get; set; }

    /// <summary>JSON array của URL ảnh người dùng upload.</summary>
    public string? ImageUrls { get; set; }

    /// <summary>Raw JSON response từ Gemini API.</summary>
    public string? ResultJson { get; set; }

    /// <summary>Tổng diện tích ước tính cần thiết (m²).</summary>
    public double? EstimatedVolumeM3 { get; set; }

    /// <summary>Loại kho gợi ý (vd: "Kho thường", "Kho lạnh / mát").</summary>
    public string? SuggestedType { get; set; }

    /// <summary>Ghi chú đặc biệt từ AI (vd: "Có bật lửa - không để kho dễ cháy").</summary>
    public string? SpecialNotes { get; set; }

    /// <summary>Độ tự tin của AI (0.0 – 1.0).</summary>
    public double? Confidence { get; set; }

    /// <summary>Loại phiên: "IMAGE_ANALYSIS" hoặc "SMART_SEARCH".</summary>
    public string SessionType { get; set; } = "IMAGE_ANALYSIS";

    /// <summary>Câu prompt người dùng nhập (chỉ dùng cho SMART_SEARCH).</summary>
    public string? UserPrompt { get; set; }

    public virtual User User { get; set; } = null!;
}

