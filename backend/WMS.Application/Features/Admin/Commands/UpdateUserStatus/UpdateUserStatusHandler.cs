using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Admin.Commands.UpdateUserStatus;

public class UpdateUserStatusHandler : IRequestHandler<UpdateUserStatusCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserStatusHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null)
        {
            return ApiResponse<bool>.FailureResult("User not found");
        }

        user.Status = request.Status;
        user.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.SuccessResult(true, "User status updated successfully");
    }
}
