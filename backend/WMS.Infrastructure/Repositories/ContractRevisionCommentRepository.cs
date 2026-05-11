using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class ContractRevisionCommentRepository : IContractRevisionCommentRepository
{
    private readonly ApplicationDbContext _context;

    public ContractRevisionCommentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> AddAsync(ContractRevisionComment comment)
    {
        _context.ContractRevisionComments.Add(comment);
        await _context.SaveChangesAsync();
        return comment.CommentId;
    }

    public async Task<List<ContractRevisionComment>> GetByThreadIdAsync(int threadId)
    {
        return await _context.ContractRevisionComments
            .Where(c => c.ThreadId == threadId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }
}
