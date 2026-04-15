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
    private readonly IStaffMembershipRepository _membershipRepo;
    private readonly IRentalContractRepository _contractRepo;

    public CreateAuditSessionHandler(
        ApplicationDbContext db,
        ITaskRepository taskRepo,
        IStaffMembershipRepository membershipRepo,
        IRentalContractRepository contractRepo)
    {
        _db             = db;
        _taskRepo       = taskRepo;
        _membershipRepo = membershipRepo;
        _contractRepo   = contractRepo;
    }

    public async Task<ApiResponse<int>> Handle(CreateAuditSessionCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.WarehouseId == request.WarehouseId, cancellationToken);
        if (warehouse == null)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy kho với ID {request.WarehouseId}.");

        var creatorExists = await _db.Users.AnyAsync(u => u.UserId == request.CreatedBy, cancellationToken);
        if (!creatorExists)
            return ApiResponse<int>.ErrorResponse($"Không tìm thấy người dùng với ID {request.CreatedBy}.");

        bool isOperator = await _membershipRepo.HasRoleAsync(
            request.CreatedBy, request.WarehouseId, "OPERATOR", cancellationToken);

        bool isRenter = !isOperator && await _contractRepo.IsRenterByContractAsync(
            request.CreatedBy, request.WarehouseId, cancellationToken);

        if (!isOperator && !isRenter)
            return ApiResponse<int>.ErrorResponse(
                "Chỉ OPERATOR hoặc RENTER (có hợp đồng đang hiệu lực) mới có thể tạo phiên kiểm kê.");

        var role = isOperator ? "OPERATOR" : "RENTER";

        if (role == "RENTER")
        {
            var now          = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var hasCreatedThisMonth = await _db.AuditSessions
                .AnyAsync(a =>
                    a.WarehouseId == request.WarehouseId &&
                    a.CreatedBy   == request.CreatedBy   &&
                    a.CreatedAt   >= startOfMonth        &&
                    a.Status      != "REJECTED"          &&
                    a.Status      != "CANCELLED",
                    cancellationToken);
            if (hasCreatedThisMonth)
                return ApiResponse<int>.ErrorResponse(
                    "Bạn chỉ được tạo yêu cầu kiểm kê 1 lần/tháng cho mỗi kho. Vui lòng đợi sang tháng sau.");
        }

        var existingOpen = await _db.AuditSessions
            .AnyAsync(a =>
                a.WarehouseId == request.WarehouseId &&
                (a.Status == "OPEN" || a.Status == "PENDING_APPROVAL" ||
                 a.Status == "APPROVED" || a.Status == "IN_PROGRESS"),
                cancellationToken);
        if (existingOpen)
            return ApiResponse<int>.ErrorResponse(
                "Kho này đã có phiên kiểm kê đang hoạt động. Vui lòng hoàn thành phiên hiện tại trước.");

        var status     = role == "OPERATOR" ? "APPROVED" : "PENDING_APPROVAL";
        var notePrefix = role == "OPERATOR" ? "Điều phối viên" : "Người thuê";

        var session = new AuditSession
        {
            WarehouseId = request.WarehouseId,
            CreatedBy   = request.CreatedBy,
            Status      = status,
            Notes       = string.IsNullOrWhiteSpace(request.Notes) ? null : $"{notePrefix}: {request.Notes}",
            CreatedAt   = DateTime.UtcNow
        };

        _db.AuditSessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        await _taskRepo.CreateWorkflowTaskAsync(
            "AUDIT",
            session.AuditId,
            session.WarehouseId,
            session.CreatedAt,
            cancellationToken);

        var message = role == "OPERATOR"
            ? "Tạo phiên kiểm kê thành công."
            : "Tạo yêu cầu kiểm kê thành công. Chờ chủ kho duyệt.";

        return ApiResponse<int>.SuccessResponse(session.AuditId, message);
    }
}
