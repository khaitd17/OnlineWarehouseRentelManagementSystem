using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.CreateAuditSession;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Audit;

public class CreateAuditSessionHandler : IRequestHandler<CreateAuditSessionCommand, ApiResponse<int>>
{
    private readonly ApplicationDbContext _db;
    private readonly ITaskRepository _taskRepo;
    private readonly IRentalContractRepository _contractRepo;

    public CreateAuditSessionHandler(
        ApplicationDbContext db,
        ITaskRepository taskRepo,
        IRentalContractRepository contractRepo)
    {
        _db = db;
        _taskRepo = taskRepo;
        _contractRepo = contractRepo;
    }

    public async Task<ApiResponse<int>> Handle(CreateAuditSessionCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);
        if (warehouse == null)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");

        var creatorExists = await _db.Users.AnyAsync(u => u.UserId == request.CreatedBy, cancellationToken);
        if (!creatorExists)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy người dùng với ID {request.CreatedBy}.");

        // Chỉ RENTER (có hợp đồng đang hiệu lực) mới được tạo yêu cầu kiểm kê.
        // OWNER và OPERATOR không tạo kiểm kê — họ chỉ duyệt, giao việc và đóng phiên.
        bool isRenter = await _contractRepo.IsRenterByContractAsync(
            request.CreatedBy, request.WarehouseId, cancellationToken);

        if (!isRenter)
            return ApiResponse<int>.ErrorResponse(
                "Chỉ người thuê kho (có hợp đồng đang hiệu lực) mới có thể tạo yêu cầu kiểm kê.");

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var hasCreatedThisMonth = await _db.AuditSessions
            .AnyAsync(a =>
                a.WarehouseId == request.WarehouseId &&
                a.CreatedBy == request.CreatedBy &&
                a.CreatedAt >= startOfMonth &&
                a.Status != "REJECTED" &&
                a.Status != "CANCELLED",
                cancellationToken);
        if (hasCreatedThisMonth)
            return ApiResponse<int>.ErrorResponse(
                "Bạn chỉ được tạo yêu cầu kiểm kê 1 lần/tháng cho mỗi kho. Vui lòng đợi sang tháng sau.");

        var session = new AuditSession
        {
            WarehouseId = request.WarehouseId,
            CreatedBy = request.CreatedBy,
            Status = "PENDING_APPROVAL",
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : $"Người thuê: {request.Notes}",
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditSessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        await _taskRepo.CreateWorkflowTaskAsync(
            "AUDIT",
            session.AuditId,
            session.WarehouseId,
            session.CreatedAt,
            cancellationToken);

        var message = "Tạo yêu cầu kiểm kê thành công. Chờ chủ kho/điều phối viên duyệt.";

        return ApiResponse<int>.SuccessResponse(session.AuditId, message);
    }
}
