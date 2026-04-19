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
        var multiImageInstr = imageCount > 1
            ? $"== XỬ LÝ {imageCount} ẢNH ==\n" +
              "B1. Quét từng ảnh riêng biệt, liệt kê tất cả đồ vật.\n" +
              "B2. Loại bỏ trùng lặp: cùng màu+kiểu+vị trí tương đối → chỉ đếm 1 lần.\n" +
              "B3. Nếu 2 ảnh là 2 phòng khác nhau → CỘNG DỒN đồ vật.\n" +
              "B4. Xuất JSON tổng hợp.\n"
            : "";

        parts.Add(new
        {
            text = "Bạn là chuyên gia nhận dạng đồ vật trong ảnh nhà ở Việt Nam để ước tính thể tích lưu kho.\n" +
                   multiImageInstr + "\n" +
                   "== QUY TẮC NHẬN DIỆN ==\n" +
                   "1. Nhận dạng TẤT CẢ đồ vật nhìn thấy, kể cả nhỏ (đèn, gối, chăn, laptop, loa...).\n" +
                   "2. Đếm từng cái riêng (4 ghế → quantity=4, KHÔNG gộp 'bộ ghế').\n" +
                   "3. Bỏ qua: ổ điện gắn tường, rèm cửa, tranh nhỏ, cây nhỏ trong chậu <0.02m³.\n" +
                   "4. Dùng kích thước khi tháo rời/đóng thùng để vận chuyển.\n" +
                   "5. Tên đồ vật phải cụ thể (Sofa 3 chỗ, Tivi 55 inch, Tủ quần áo 2 cánh).\n\n" +
                   "== BẢNG KÍCH THƯỚC (Rộng×Dài×Cao mét) ==\n" +
                   "PHÒNG NGỦ:\n" +
                   "Giường đơn: 1.0×2.0×0.45=0.90m³ | Giường đôi: 1.6×2.0×0.45=1.44m³ | Giường king: 1.8×2.0×0.45=1.62m³\n" +
                   "Tủ quần áo 1 cánh: 0.8×0.55×2.0=0.88m³ | 2 cánh: 1.2×0.55×2.0=1.32m³ | 3 cánh: 1.8×0.55×2.0=1.98m³\n" +
                   "Tủ đầu giường: 0.45×0.4×0.55=0.10m³ | Bàn trang điểm+gương: 1.0×0.45×1.5=0.68m³\n" +
                   "Gối ngủ: 0.65×0.45×0.15=0.044m³ | Chăn/mền cuộn: 0.5×0.5×0.4=0.10m³\n\n" +
                   "PHÒNG KHÁCH:\n" +
                   "Sofa 1 chỗ: 0.85×0.9×0.85=0.65m³ | Sofa 2 chỗ: 1.5×0.9×0.85=1.15m³ | Sofa 3 chỗ: 2.1×0.9×0.85=1.61m³\n" +
                   "Sofa góc L: 2.8×1.8×0.85=2.50m³ | Bàn trà: 1.1×0.6×0.45=0.30m³ | Kệ tivi: 1.5×0.45×0.55=0.37m³\n" +
                   "Tivi 32\": 0.75×0.06×0.46=0.021m³ | 43\": 0.97×0.06×0.57=0.033m³ | 55\": 1.25×0.07×0.72=0.063m³ | 65\": 1.45×0.08×0.85=0.099m³\n" +
                   "Máy lạnh treo tường: 0.9×0.25×0.3=0.068m³ | Quạt đứng: 0.5×0.5×1.3=0.33m³\n\n" +
                   "PHÒNG BẾP:\n" +
                   "Tủ lạnh mini: 0.5×0.55×0.85=0.23m³ | Tủ lạnh thường: 0.6×0.65×1.5=0.59m³ | Lớn>300L: 0.7×0.7×1.8=0.88m³ | 2 cánh: 0.9×0.7×1.85=1.16m³\n" +
                   "Máy giặt cửa trước: 0.6×0.6×0.85=0.31m³ | Cửa trên: 0.55×0.55×0.95=0.29m³\n" +
                   "Lò vi sóng: 0.5×0.38×0.3=0.057m³ | Nồi cơm điện: 0.35×0.35×0.3=0.037m³ | Máy rửa bát: 0.6×0.6×0.85=0.31m³\n\n" +
                   "VĂN PHÒNG:\n" +
                   "Bàn làm việc nhỏ: 1.0×0.6×0.75=0.45m³ | Lớn: 1.4×0.7×0.75=0.74m³\n" +
                   "Ghế văn phòng bánh xe: 0.65×0.65×1.2=0.51m³ | Ghế gỗ: 0.45×0.45×0.90=0.18m³ | Ghế ăn: 0.45×0.5×0.9=0.20m³\n" +
                   "Kệ sách ngắn: 0.8×0.3×1.0=0.24m³ | Cao: 0.9×0.3×1.8=0.49m³ | Tủ hồ sơ: 0.47×0.6×1.35=0.38m³\n" +
                   "Màn hình 24\": 0.56×0.18×0.40=0.040m³ | Laptop: 0.38×0.28×0.03=0.003m³ | Máy in A4: 0.48×0.37×0.26=0.046m³\n\n" +
                   "ĐỒ VẬT KHÁC:\n" +
                   "Xe máy: 2.0×0.75×1.15=1.73m³ | Xe đạp: 1.8×0.65×1.1=1.29m³ | Xe đẩy em bé: 1.05×0.6×1.1=0.69m³\n" +
                   "Cây nước nóng lạnh: 0.3×0.3×1.2=0.11m³ | Tủ giày: 0.7×0.35×1.0=0.25m³\n" +
                   "Thùng carton nhỏ: 0.3×0.3×0.3=0.027m³ | Vừa: 0.5×0.4×0.4=0.080m³ | Lớn: 0.6×0.5×0.5=0.150m³\n" +
                   "Loa đứng: 0.25×0.25×1.1=0.069m³ | Đàn guitar: 0.4×0.15×1.0=0.060m³ | Piano điện: 1.4×0.4×0.85=0.48m³\n" +
                   "Máy hút bụi: 0.35×0.35×1.1=0.135m³ | Bàn ăn 4 người: 1.2×0.8×0.75=0.72m³ | 6 người: 1.8×0.9×0.75=1.22m³\n" +
                   "Đèn bàn: 0.2×0.2×0.45=0.018m³ | Đèn sàn: 0.3×0.3×1.7=0.15m³\n\n" +
                   "== OUTPUT (chỉ JSON, KHÔNG text/markdown khác) ==\n" +
                   "{\n" +
                   "  \"items\": [\n" +
                   "    {\n" +
                   "      \"name\": \"tên đồ vật tiếng Việt cụ thể\",\n" +
                   "      \"quantity\": <số nguyên dương>,\n" +
                   "      \"widthM\": <chiều rộng mét>,\n" +
                   "      \"lengthM\": <chiều dài mét>,\n" +
                   "      \"heightM\": <chiều cao mét>,\n" +
                   "      \"estimatedVolumeM3\": <widthM*lengthM*heightM làm tròn 4 số>\n" +
                   "    }\n" +
                   "  ],\n" +
                   "  \"totalEstimatedVolumeM3\": <tổng quantity*estimatedVolumeM3 làm tròn 2 số>,\n" +
                   "  \"suggestedWarehouseType\": \"<Kho thường|Kho lạnh / mát|Kho hàng điện tử|Kho chuyên dụng>\",\n" +
                   "  \"specialNotes\": \"<ghi chú hoặc null>\",\n" +
                   "  \"confidence\": <0.0-1.0>\n" +
                   "}\n\n" +
                   "Nếu ảnh quá tối/mờ: items=[], confidence<0.3."
        });

        var requestBody = new
        {
            contents = new[]
            {
                new { parts }
            },
            generationConfig = new
            {
                temperature = 0.05,
                maxOutputTokens = imageCount > 2 ? 8192 : 4096
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
                    var w = item.TryGetProperty("widthM",  out var wp) ? wp.GetDouble() : 0.0;
                    var l = item.TryGetProperty("lengthM", out var lp) ? lp.GetDouble() : 0.0;
                    var h = item.TryGetProperty("heightM", out var hp) ? hp.GetDouble() : 0.0;
                    var vol = item.TryGetProperty("estimatedVolumeM3", out var vp)
                        ? vp.GetDouble()
                        : (w * l * h > 0 ? Math.Round(w * l * h, 4) : 0.1);

                    // Nếu AI không trả về widthM/lengthM/heightM, ước tính ngược từ volume
                    if (w == 0 && l == 0 && h == 0 && vol > 0)
                    {
                        var side = Math.Round(Math.Cbrt(vol), 2);
                        w = side; l = side; h = side;
                    }

                    items.Add(new DetectedItem(
                        Name: item.GetProperty("name").GetString() ?? "Đồ vật không xác định",
                        Quantity: item.TryGetProperty("quantity", out var qty) ? qty.GetInt32() : 1,
                        EstimatedVolumeM3: vol,
                        WidthM:  Math.Round(w, 2),
                        LengthM: Math.Round(l, 2),
                        HeightM: Math.Round(h, 2)
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
