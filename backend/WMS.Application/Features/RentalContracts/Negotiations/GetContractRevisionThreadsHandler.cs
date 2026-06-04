using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class GetContractRevisionThreadsHandler : IRequestHandler<GetContractRevisionThreadsQuery, List<ContractRevisionThreadDto>>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractRevisionThreadRepository _threadRepo;
    private readonly IContractRevisionCommentRepository _commentRepo;
    private readonly IUserRepository _userRepo;

    public GetContractRevisionThreadsHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractRevisionThreadRepository threadRepo,
        IContractRevisionCommentRepository commentRepo,
        IUserRepository userRepo)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _threadRepo = threadRepo;
        _commentRepo = commentRepo;
        _userRepo = userRepo;
    }

    public async Task<List<ContractRevisionThreadDto>> Handle(GetContractRevisionThreadsQuery request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);

        var isRenter = contract.RenterId == request.UserId;
        var isOwner = warehouse?.OwnerId == request.UserId;
        if (!isRenter && !isOwner)
            throw new UnauthorizedAccessException("Access denied");

        var threads = await _threadRepo.GetByContractIdAsync(request.ContractId);
        var threadDtos = new List<ContractRevisionThreadDto>();

        var userCache = new Dictionary<int, UserRecord?>();
        async Task<UserRecord?> GetUserAsync(int userId)
        {
            if (userCache.TryGetValue(userId, out var cached)) return cached;
            var user = await _userRepo.GetByIdAsync(userId, cancellationToken);
            userCache[userId] = user;
            return user;
        }

        foreach (var thread in threads)
        {
            var comments = await _commentRepo.GetByThreadIdAsync(thread.ThreadId);
            var createdBy = await GetUserAsync(thread.CreatedBy);
            var resolvedBy = thread.ResolvedBy.HasValue ? await GetUserAsync(thread.ResolvedBy.Value) : null;

            var commentDtos = new List<ContractRevisionCommentDto>();
            foreach (var comment in comments)
            {
                var commenter = await GetUserAsync(comment.UserId);
                commentDtos.Add(new ContractRevisionCommentDto
                {
                    CommentId = comment.CommentId,
                    ThreadId = comment.ThreadId,
                    UserId = comment.UserId,
                    UserName = commenter?.FullName ?? "Unknown",
                    Message = comment.Message,
                    CreatedAt = DateTime.SpecifyKind(comment.CreatedAt, DateTimeKind.Utc)
                });
            }

            threadDtos.Add(new ContractRevisionThreadDto
            {
                ThreadId = thread.ThreadId,
                ContractId = thread.ContractId,
                Section = thread.Section,
                Status = thread.Status,
                CreatedBy = thread.CreatedBy,
                CreatedByName = createdBy?.FullName ?? "Unknown",
                CreatedAt = DateTime.SpecifyKind(thread.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = thread.UpdatedAt.HasValue ? DateTime.SpecifyKind(thread.UpdatedAt.Value, DateTimeKind.Utc) : null,
                ResolvedBy = thread.ResolvedBy,
                ResolvedByName = resolvedBy?.FullName,
                ResolvedAt = thread.ResolvedAt.HasValue ? DateTime.SpecifyKind(thread.ResolvedAt.Value, DateTimeKind.Utc) : null,
                Comments = commentDtos
            });
        }

        return threadDtos;
    }
}
