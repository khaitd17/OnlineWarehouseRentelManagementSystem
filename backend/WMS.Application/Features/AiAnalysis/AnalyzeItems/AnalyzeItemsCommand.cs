using MediatR;
using Microsoft.AspNetCore.Http;

namespace WMS.Application.Features.AiAnalysis.AnalyzeItems;

/// <summary>
/// Command phân tích ảnh đồ vật bằng AI và gợi ý kho phù hợp.
/// </summary>
public record AnalyzeItemsCommand(
    int UserId,
    List<IFormFile> Images,
    string? PreferredProvince,
    string? PreferredDistrict
) : IRequest<AnalyzeItemsResult>;
