using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class ReceiptNoteRepository : IReceiptNoteRepository
{
    private readonly ApplicationDbContext _context;

    public ReceiptNoteRepository(ApplicationDbContext context)
        => _context = context;

    public async Task<List<ReceiptNote>> GetByRequestIdAsync(int invReqId, CancellationToken cancellationToken)
        => await _context.ReceiptNotes
            .Include(n => n.ReceiptItems).ThenInclude(i => i.Asset)
            .Include(n => n.ReceiptItems).ThenInclude(i => i.InventoryItem)
            .Include(n => n.ReceivedByStaff)
            .Where(n => n.InvReqId == invReqId)
            .OrderBy(n => n.ReceivedAt)
            .ToListAsync(cancellationToken);

    public async Task<ReceiptNote?> GetByIdAsync(int receiptNoteId, CancellationToken cancellationToken)
        => await _context.ReceiptNotes
            .Include(n => n.ReceiptItems).ThenInclude(i => i.Asset)
            .Include(n => n.ReceiptItems).ThenInclude(i => i.InventoryItem)
            .Include(n => n.ReceivedByStaff)
            .Include(n => n.InvReq).ThenInclude(r => r.Renter)
            .Include(n => n.InvReq).ThenInclude(r => r.Warehouse)
            .FirstOrDefaultAsync(n => n.ReceiptNoteId == receiptNoteId, cancellationToken);

    public async Task<int> CountByRequestIdAsync(int invReqId, CancellationToken cancellationToken)
        => await _context.ReceiptNotes.CountAsync(n => n.InvReqId == invReqId, cancellationToken);

    public async Task<ReceiptNote> CreateAsync(ReceiptNote note, CancellationToken cancellationToken)
    {
        note.CreatedAt = DateTime.Now;
        _context.ReceiptNotes.Add(note);
        await _context.SaveChangesAsync(cancellationToken);
        return note;
    }

    public async Task UpdateAsync(ReceiptNote note, CancellationToken cancellationToken)
    {
        note.UpdatedAt = DateTime.Now;
        _context.ReceiptNotes.Update(note);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
