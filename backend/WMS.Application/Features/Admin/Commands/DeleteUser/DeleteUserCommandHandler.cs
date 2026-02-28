using MediatR;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.DeleteUser;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteUserCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null)
        {
            return ApiResponse<bool>.FailureResult("User not found");
        }

        // Potential check for associated data (e.g. warehouses)
        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(true, "User deleted successfully");
    }
}
