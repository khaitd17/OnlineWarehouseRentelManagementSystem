using MediatR;
using WMS.Application.Features.RentalContracts.Common;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.GetMyRentalContracts;

public class GetMyRentalContractsHandler : IRequestHandler<GetMyRentalContractsQuery, IEnumerable<RentalContractDto>>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IUserRepository _userRepo;
    private readonly IWarehouseRepository _warehouseRepo;

    public GetMyRentalContractsHandler(
        IRentalContractRepository contractRepo,
        IUserRepository userRepo,
        IWarehouseRepository warehouseRepo)
    {
        _contractRepo = contractRepo;
        _userRepo = userRepo;
        _warehouseRepo = warehouseRepo;
    }

    public async Task<IEnumerable<RentalContractDto>> Handle(
        GetMyRentalContractsQuery request,
        CancellationToken cancellationToken)
    {
        IEnumerable<WMS.Domain.Entities.RentalContract> contracts;

        // if WarehouseId is provided, get contracts by warehouse (owner view)
        if (request.WarehouseId.HasValue)
        {
            contracts = await _contractRepo.GetByWarehouseIdAsync(request.WarehouseId.Value);
        }
        else
        {
            contracts = await _contractRepo.GetByRenterIdAsync(request.UserId);
        }

        var result = new List<RentalContractDto>();
        foreach (var contract in contracts)
        {
            var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);
            var renter = await _userRepo.GetByIdAsync(contract.RenterId, cancellationToken);

            result.Add(new RentalContractDto
            {
                ContractId = contract.ContractId,
                RentalRequestId = contract.RentalRequestId,
                ContractNumber = contract.ContractNumber,
                RenterId = contract.RenterId,
                RenterName = renter?.FullName ?? "Unknown",
                RenterEmail = renter?.Email ?? "",
                WarehouseId = contract.WarehouseId,
                WarehouseName = warehouse?.Name ?? "Unknown",
                WarehouseAddress = warehouse?.Address ?? "",
                StartDate = contract.StartDate,
                EndDate = contract.EndDate,
                MonthlyPayment = contract.MonthlyPayment,
                TotalValue = contract.TotalValue,
                DepositAmount = contract.DepositAmount,
                Status = contract.Status,
                Terms = contract.Terms,
                ContractFileUrl = contract.ContractFileUrl,
                SignedFileUrl = contract.SignedFileUrl,
                SignedAt = contract.SignedAt,
                CreatedAt = contract.CreatedAt
            });
        }

        return result;
    }
}
