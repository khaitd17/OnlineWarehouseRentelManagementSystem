using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.GetContractLogs;

public class GetContractLogsHandler : IRequestHandler<GetContractLogsQuery, List<ContractLogDto>>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IContractLogRepository _logRepo;
    private readonly IWarehouseRepository _warehouseRepo;

    public GetContractLogsHandler(
        IRentalContractRepository contractRepo,
        IContractLogRepository logRepo,
        IWarehouseRepository warehouseRepo)
    {
        _contractRepo = contractRepo;
        _logRepo = logRepo;
        _warehouseRepo = warehouseRepo;
    }

    public async Task<List<ContractLogDto>> Handle(GetContractLogsQuery request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);

        var isRenter = contract.RenterId == request.UserId;
        var isOwner = warehouse?.OwnerId == request.UserId;
        if (!isRenter && !isOwner)
            throw new UnauthorizedAccessException("Access denied");

        var logs = await _logRepo.GetByContractIdAsync(request.ContractId);

        return logs.Select(l => new ContractLogDto
        {
            LogId = l.LogId,
            ContractId = l.ContractId,
            UserId = l.UserId,
            Action = l.Action,
            IpAddress = l.IpAddress,
            Details = l.Details,
            CreatedAt = l.CreatedAt
        }).ToList();
    }
}
