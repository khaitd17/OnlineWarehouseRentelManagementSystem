using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

/// <summary>
/// Repository để lưu và truy vấn lịch sử phân tích AI.
/// </summary>
public class AiAnalysisSessionRepository : IAiAnalysisSessionRepository
{
    private readonly ApplicationDbContext _context;

    public AiAnalysisSessionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Đếm số lần user đã gọi AI hôm nay (timezone UTC).</summary>
    public async Task<int> CountTodayAsync(int userId, CancellationToken cancellationToken)
    {
        var todayUtc = DateTime.UtcNow.Date;
        return await _context.AiAnalysisSessions
            .Where(s => s.UserId == userId && s.AnalyzedAt >= todayUtc)
            .CountAsync(cancellationToken);
    }

    /// <summary>Lưu một phiên phân tích mới.</summary>
    public async Task<AiAnalysisSession> AddAsync(
        AiAnalysisSession session,
        CancellationToken cancellationToken)
    {
        session.AnalyzedAt = DateTime.UtcNow;
        _context.AiAnalysisSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);
        return session;
    }

    /// <summary>Lấy lịch sử phân tích của user, mới nhất trước, tối đa 20 bản ghi.</summary>
    public async Task<List<AiAnalysisSession>> GetByUserAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        return await _context.AiAnalysisSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.AnalyzedAt)
            .Take(20)
            .ToListAsync(cancellationToken);
    }

    /// <summary>Lấy chi tiết 1 phiên cụ thể.</summary>
    public async Task<AiAnalysisSession?> GetByIdAsync(
        int sessionId,
        CancellationToken cancellationToken)
    {
        return await _context.AiAnalysisSessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId, cancellationToken);
    }
}
