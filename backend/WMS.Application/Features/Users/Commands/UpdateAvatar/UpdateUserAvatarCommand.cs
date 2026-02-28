using MediatR;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Users.Commands.UpdateAvatar;

public record UpdateUserAvatarCommand(int UserId, string AvatarUrl) : IRequest<ApiResponse<bool>>;

public class UpdateUserAvatarCommandHandler : IRequestHandler<UpdateUserAvatarCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserAvatarCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateUserAvatarCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null)
        {
            return ApiResponse<bool>.FailureResult("User not found");
        }

        user.AvatarUrl = request.AvatarUrl;
        user.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(true, "Avatar updated successfully");
    }
}
