using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class GetContractVersionsHandler : IRequestHandler<GetContractVersionsQuery, List<ContractVersionDto>>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractVersionRepository _versionRepo;
    private readonly IUserRepository _userRepo;

    public GetContractVersionsHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractVersionRepository versionRepo,
        IUserRepository userRepo)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _versionRepo = versionRepo;
        _userRepo = userRepo;
    }

    public async Task<List<ContractVersionDto>> Handle(GetContractVersionsQuery request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);

        var isRenter = contract.RenterId == request.UserId;
        var isOwner = warehouse?.OwnerId == request.UserId;
        if (!isRenter && !isOwner)
            throw new UnauthorizedAccessException("Access denied");

        var versions = await _versionRepo.GetByContractIdAsync(request.ContractId);
        var userCache = new Dictionary<int, UserRecord?>();

        async Task<UserRecord?> GetUserAsync(int userId)
        {
            if (userCache.TryGetValue(userId, out var cached)) return cached;
            var user = await _userRepo.GetByIdAsync(userId, cancellationToken);
            userCache[userId] = user;
            return user;
        }

        var result = new List<ContractVersionDto>();
        foreach (var version in versions)
        {
            var user = await GetUserAsync(version.CreatedBy);
            result.Add(new ContractVersionDto
            {
                VersionId = version.VersionId,
                ContractId = version.ContractId,
                VersionNumber = version.VersionNumber,
                SnapshotJson = version.SnapshotJson,
                CreatedBy = version.CreatedBy,
                CreatedByName = user?.FullName ?? "Unknown",
                CreatedAt = version.CreatedAt
            });
        }

        return result;
    }
}
