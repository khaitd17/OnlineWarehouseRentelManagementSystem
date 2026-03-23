using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class ContractVerificationRepository : IContractVerificationRepository
{
    private readonly ApplicationDbContext _context;

    public ContractVerificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> AddAsync(ContractVerification verification)
    {
        _context.ContractVerifications.Add(verification);
        await _context.SaveChangesAsync();
        return verification.VerificationId;
    }

    public async Task<ContractVerification?> GetLatestByContractAndUserAsync(int contractId, int userId)
    {
        return await _context.ContractVerifications
            .Where(v => v.ContractId == contractId && v.UserId == userId)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task MarkAsVerifiedAsync(int verificationId)
    {
        var verification = await _context.ContractVerifications.FindAsync(verificationId);
        if (verification != null)
        {
            verification.IsVerified = true;
            verification.VerifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
