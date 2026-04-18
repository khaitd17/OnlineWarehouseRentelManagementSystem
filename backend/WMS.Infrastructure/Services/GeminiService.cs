using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using WMS.Domain.Interfaces;

namespace WMS.Infrastructure.Services;

/// <summary>
/// Gọi Google Gemini Vision API để phân tích ảnh đồ vật.
/// </summary>
public class GeminiService : IGeminiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _http = httpClientFactory.CreateClient("Gemini");
        _apiKey = configuration["GeminiSettings:ApiKey"]
                  ?? throw new InvalidOperationException("GeminiSettings:ApiKey is not configured.");
        _model = configuration["GeminiSettings:Model"] ?? "gemini-1.5-flash";
    }

    public async Task<GeminiAnalysisResult> AnalyzeItemsAsync(
        List<byte[]> imageBytes,
        CancellationToken cancellationToken)
    {
        if (imageBytes == null || imageBytes.Count == 0)
            throw new ArgumentException("Phải cung cấp ít nhất 1 ảnh.", nameof(imageBytes));

        // ── Build parts: ảnh + text prompt ──────────────────────────
        var parts = new List<object>();

        foreach (var bytes in imageBytes)
        {
            parts.Add(new
            {
                inlineData = new
                {
                    mimeType = "image/jpeg",
                    data = Convert.ToBase64String(bytes)
                }
            });
        }

        // Prompt yêu cầu Gemini trả về JSON có cấu trúc
        parts.Add(new
        {
            text = """
            Bạn là chuyên gia phân tích đồ vật trong ảnh cho hệ thống cho thuê kho hàng tại Việt Nam.
            
            Hãy phân tích TẤT CẢ đồ vật bạn nhìn thấy trong các ảnh được cung cấp.
            
            Trả về KẾT QUẢ ĐÚNG THEO JSON SCHEMA sau (không thêm markdown, không thêm text ngoài JSON):
            {
              "items": [
                {
                  "name": "tên đồ vật (tiếng Việt)",
                  "quantity": <số nguyên>,
                  "estimatedVolumeM3": <số thực, thể tích ước tính theo mét khối>
                }
              ],
              "totalEstimatedVolumeM3": <tổng thể tích m³, số thực>,
              "suggestedWarehouseType": "<1 trong: Kho thường|Kho lạnh / mát|Kho hàng điện tử|Kho chuyên dụng>",
              "specialNotes": "<ghi chú nếu có: hàng dễ vỡ, hàng điện, cần môi trường đặc biệt... hoặc null>",
              "confidence": <độ tự tin 0.0-1.0>
            }
            
            Quy tắc ước tính thể tích (m³):
            - Tủ lạnh thông thường: ~0.35 m³
            - Máy giặt: ~0.25 m³  
            - Sofa 3 chỗ: ~0.80 m³
            - Giường đôi (gồm nệm): ~1.20 m³
            - Bàn làm việc lớn: ~0.50 m³
            - Tủ quần áo 2 cánh: ~1.00 m³
            - Thùng các-tông nhỏ (30x30x30cm): ~0.03 m³
            - Thùng các-tông lớn (60x40x40cm): ~0.10 m³
            - TV 55 inch: ~0.15 m³
            - Xe máy: ~1.50 m³
            
            Nếu không nhận dạng được đồ vật hoặc ảnh quá mờ, hãy trả về items rỗng và confidence thấp.
            """
        });

        var requestBody = new
        {
            contents = new[]
            {
                new { parts }
            },
            generationConfig = new
            {
                temperature = 0.1   // Thấp để output nhất quán hơn
            }
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        var json = JsonSerializer.Serialize(requestBody, jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var url = $"https://generativelanguage.googleapis.com/v1/models/{_model}:generateContent?key={_apiKey}";

        // ── Gọi Gemini API ───────────────────────────────────────────
        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsync(url, content, cancellationToken);
        }
        catch (TaskCanceledException)
        {
            throw new TimeoutException("Gemini API không phản hồi trong thời gian cho phép. Vui lòng thử lại.");
        }

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Gemini API trả về lỗi {(int)response.StatusCode}: {responseBody}");
        }

        // ── Parse response ───────────────────────────────────────────
        return ParseGeminiResponse(responseBody);
    }

    private static GeminiAnalysisResult ParseGeminiResponse(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);

            // Lấy text từ candidates[0].content.parts[0].text
            var text = doc
                .RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "{}";

            // Strip markdown code block nếu Gemini trả về ```json ... ```
            var jsonText = text.Trim();
            if (jsonText.StartsWith("```"))
            {
                var firstNewLine = jsonText.IndexOf('\n');
                if (firstNewLine >= 0) jsonText = jsonText[(firstNewLine + 1)..];
                var lastFence = jsonText.LastIndexOf("```");
                if (lastFence >= 0) jsonText = jsonText[..lastFence];
                jsonText = jsonText.Trim();
            }

            // Parse JSON kết quả phân tích
            using var resultDoc = JsonDocument.Parse(jsonText);

            var root = resultDoc.RootElement;

            var items = new List<DetectedItem>();
            if (root.TryGetProperty("items", out var itemsEl))
            {
                foreach (var item in itemsEl.EnumerateArray())
                {
                    items.Add(new DetectedItem(
                        Name: item.GetProperty("name").GetString() ?? "Đồ vật không xác định",
                        Quantity: item.TryGetProperty("quantity", out var qty) ? qty.GetInt32() : 1,
                        EstimatedVolumeM3: item.TryGetProperty("estimatedVolumeM3", out var vol)
                            ? vol.GetDouble() : 0.1
                    ));
                }
            }

            var totalVolume = root.TryGetProperty("totalEstimatedVolumeM3", out var tv)
                ? tv.GetDouble() : items.Sum(i => i.EstimatedVolumeM3 * i.Quantity);

            var suggestedType = root.TryGetProperty("suggestedWarehouseType", out var st)
                ? st.GetString() ?? "Kho thường" : "Kho thường";

            var specialNotes = root.TryGetProperty("specialNotes", out var sn)
                ? (sn.ValueKind == JsonValueKind.Null ? null : sn.GetString()) : null;

            var confidence = root.TryGetProperty("confidence", out var conf)
                ? conf.GetDouble() : 0.7;

            return new GeminiAnalysisResult(
                Items: items,
                TotalVolumeM3: Math.Round(totalVolume, 2),
                SuggestedWarehouseType: suggestedType,
                SpecialNotes: specialNotes,
                Confidence: Math.Clamp(confidence, 0.0, 1.0)
            );
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Không thể parse kết quả từ Gemini AI. Chi tiết: {ex.Message}");
        }
    }
}
