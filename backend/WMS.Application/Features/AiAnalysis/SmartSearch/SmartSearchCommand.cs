using MediatR;

namespace WMS.Application.Features.AiAnalysis.SmartSearch;

/// <summary>
/// Command tìm kiếm kho thông minh bằng prompt AI.
/// </summary>
public record SmartSearchCommand(
    int UserId,
    string Prompt,
    double? Lat,
    double? Lng
) : IRequest<SmartSearchResult>;

/// <summary>Kết quả trả về cho frontend.</summary>
public record SmartSearchResult(
    int SessionId,
    string AiSummary,
    List<SmartSearchWarehouseDto> Warehouses,
    List<string> FollowUpSuggestions
);

/// <summary>Một kho được AI xếp hạng, kèm đầy đủ thông tin hiển thị.</summary>
public record SmartSearchWarehouseDto(
    // Thông tin kho cơ bản
    int WarehouseId,
    string Name,
    string Address,
    string? WarehouseType,
    double TotalArea,
    double AvailableArea,
    decimal? PricePerM2,
    bool Is24HoursAccess,
    string? OperatingHours,
    string? ImageUrl,
    double? Lat,
    double? Lng,
    double? AverageRating,
    int RatingCount,
    double? DistanceKm,
    // Thông tin AI
    int Rank,
    double MatchScore,
    string Explanation,
    List<string> Pros,
    List<string> Cons
);
