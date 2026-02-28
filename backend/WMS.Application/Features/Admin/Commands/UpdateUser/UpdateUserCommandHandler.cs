using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Admin.Commands.UpdateUser;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null)
        {
            return ApiResponse<bool>.FailureResult("User not found");
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != request.UserId, cancellationToken))
        {
            return ApiResponse<bool>.FailureResult("Email already exists");
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.RoleId = request.RoleId;
        user.AvatarUrl = request.AvatarUrl;
        user.Status = request.Status;
        user.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(true, "User updated successfully");
    }
}
