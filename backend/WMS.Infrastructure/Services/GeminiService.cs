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
        // Khi có nhiều ảnh, yêu cầu AI phân tích từng ảnh rồi tổng hợp để tránh trùng lặp
        var imageCount = imageBytes.Count;
        var multiImageInstructions = imageCount > 1
            ? $"""

            QUAN TRỌNG — BẠN ĐANG NHẬN {imageCount} ẢNH:
            Các ảnh này có thể chụp CÙNG MỘT CĂN PHÒNG hoặc các phòng KHÁC NHAU trong cùng một ngôi nhà.
            
            Quy trình phân tích BẮT BUỘC — hãy thực hiện theo đúng thứ tự:
            
            BƯỚC 1 — Phân tích từng ảnh riêng biệt:
            Với mỗi ảnh (Ảnh 1, Ảnh 2, ..., Ảnh {imageCount}), hãy liệt kê riêng tất cả đồ vật bạn thấy.
            
            BƯỚC 2 — Kiểm tra trùng lặp:
            So sánh danh sách đồ vật giữa các ảnh. Nếu cùng một đồ vật xuất hiện trong nhiều ảnh
            (ví dụ: cùng 1 chiếc sofa được chụp từ 2 góc khác nhau), thì CHỈ ĐẾM 1 LẦN.
            Dấu hiệu nhận biết trùng lặp: cùng vị trí, cùng màu sắc, cùng kiểu dáng, cùng loại phòng.
            
            BƯỚC 3 — Tổng hợp kết quả cuối cùng:
            Gộp danh sách đồ vật KHÔNG trùng lặp từ tất cả ảnh vào kết quả JSON duy nhất.
            Nếu 2 ảnh chụp 2 phòng khác nhau (ví dụ: phòng khách và phòng ngủ), đồ vật ở 2 phòng phải được CỘNG DỒN.
            Nếu 2 ảnh chụp cùng 1 phòng từ góc khác nhau, KHÔNG đếm đồ vật 2 lần.

            """
            : "";

        parts.Add(new
        {
            text = $$"""
            Bạn là chuyên gia phân tích đồ vật trong ảnh cho hệ thống cho thuê kho hàng tại Việt Nam.
            {{multiImageInstructions}}
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
            - Gối ngủ: ~0.02 m³
            - Chăn/mền: ~0.10 m³
            - Tranh treo tường: ~0.05 m³
            - Ghế văn phòng: ~0.20 m³
            - Kệ sách: ~0.10 m³
            - Đèn bàn / đèn ngủ: ~0.02 m³
            - Máy tính xách tay: ~0.01 m³
            - Tivi: ~0.15 m³
            
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
                temperature = 0.1,   // Thấp để output nhất quán hơn
                maxOutputTokens = imageCount > 2 ? 4096 : 2048  // Tăng token khi nhiều ảnh
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
