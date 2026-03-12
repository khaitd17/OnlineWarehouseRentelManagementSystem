using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.UpdateAccountStatus;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Handlers.Admin;

public class UpdateAccountStatusHandler : IRequestHandler<UpdateAccountStatusCommand, ApiResponse<bool>>
{
    private readonly ApplicationDbContext _db;

    public UpdateAccountStatusHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateAccountStatusCommand request, CancellationToken cancellationToken)
    {
        var validStatuses = new[] { "ACTIVE", "LOCKED", "PENDING" };
        var status = request.Status?.ToUpper();
        if (string.IsNullOrWhiteSpace(status) || !validStatuses.Contains(status))
        {
            return ApiResponse<bool>.ErrorResponse(
                "Trạng thái không hợp lệ.",
                new List<string> { "Trạng thái phải là một trong: ACTIVE, LOCKED, PENDING." });
        }

        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == request.UserId, cancellationToken);
        if (user == null)
        {
            return ApiResponse<bool>.ErrorResponse($"Không tìm thấy tài khoản với ID {request.UserId}.");
        }

        if (user.Role?.RoleName == "ADMIN")
        {
            return ApiResponse<bool>.ErrorResponse("Không thể thay đổi trạng thái tài khoản Admin.");
        }

        user.Status = status;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var statusText = status == "ACTIVE" ? "kích hoạt" : (status == "LOCKED" ? "khóa" : "chờ duyệt");
        return ApiResponse<bool>.SuccessResponse(true, $"Tài khoản đã được {statusText} thành công.");
    }
}
