using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.CreateAuditSession;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Audit;

public class CreateAuditSessionHandler : IRequestHandler<CreateAuditSessionCommand, ApiResponse<int>>
{
    private readonly ApplicationDbContext _db;

    public CreateAuditSessionHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<int>> Handle(CreateAuditSessionCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);
        if (warehouse == null)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");

        // Kiểm tra quyền sở hữu kho
        if (warehouse.OwnerId != request.CreatedBy)
            return ApiResponse<int>.ErrorResponse("Bạn không có quyền tạo phiên kiểm kê cho kho này. Chỉ chủ kho mới có thể thực hiện.");

        var creatorExists = await _db.Users.AnyAsync(u => u.UserId == request.CreatedBy, cancellationToken);
        if (!creatorExists)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy người dùng với ID {request.CreatedBy}.");

        var existingOpen = await _db.AuditSessions
            .AnyAsync(a => a.WarehouseId == request.WarehouseId && a.Status == "OPEN", cancellationToken);
        if (existingOpen)
            return ApiResponse<int>.ErrorResponse("Kho này đã có phiên kiểm kê đang mở. Vui lòng hoàn thành phiên hiện tại trước.");

        var session = new AuditSession
        {
            WarehouseId = request.WarehouseId,
            CreatedBy = request.CreatedBy,
            Status = "OPEN",
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditSessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<int>.SuccessResponse(session.AuditId, "Tạo phiên kiểm kê thành công.");
    }
}
