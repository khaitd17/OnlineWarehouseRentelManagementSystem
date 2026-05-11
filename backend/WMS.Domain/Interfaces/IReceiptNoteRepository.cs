using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IReceiptNoteRepository
{
    /// <summary>Lấy tất cả phiếu nhập/xuất của một yêu cầu.</summary>
    Task<List<ReceiptNote>> GetByRequestIdAsync(int invReqId, CancellationToken cancellationToken);

    /// <summary>Lấy phiếu theo ID (include ReceiptItems + Asset).</summary>
    Task<ReceiptNote?> GetByIdAsync(int receiptNoteId, CancellationToken cancellationToken);

    /// <summary>Đếm số phiếu đã tạo cho 1 yêu cầu (dùng để sinh ReceiptCode suffix).</summary>
    Task<int> CountByRequestIdAsync(int invReqId, CancellationToken cancellationToken);

    Task<ReceiptNote> CreateAsync(ReceiptNote note, CancellationToken cancellationToken);
    Task UpdateAsync(ReceiptNote note, CancellationToken cancellationToken);
}
