using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

/// <summary>
/// Repository để lưu và truy vấn lịch sử phân tích AI của người dùng.
/// </summary>
public interface IAiAnalysisSessionRepository
{
    /// <summary>Đếm số lần phân tích AI hôm nay của user (để check quota 10/ngày).</summary>
    Task<int> CountTodayAsync(int userId, CancellationToken cancellationToken);

    /// <summary>Lưu một phiên phân tích mới vào DB.</summary>
    Task<AiAnalysisSession> AddAsync(AiAnalysisSession session, CancellationToken cancellationToken);

    /// <summary>Lấy lịch sử phân tích của user, sắp xếp mới nhất trước.</summary>
    Task<List<AiAnalysisSession>> GetByUserAsync(int userId, CancellationToken cancellationToken);

    /// <summary>Lấy chi tiết 1 phiên cụ thể.</summary>
    Task<AiAnalysisSession?> GetByIdAsync(int sessionId, CancellationToken cancellationToken);
}
