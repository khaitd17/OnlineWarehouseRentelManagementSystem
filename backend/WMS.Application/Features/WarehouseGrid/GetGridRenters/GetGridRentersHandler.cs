using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.WarehouseGrid.GetGridRenters;

public class GetGridRentersHandler : IRequestHandler<GetGridRentersQuery, List<string>>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IUserRepository _userRepo;

    public GetGridRentersHandler(IRentalContractRepository contractRepo, IUserRepository userRepo)
    {
        _contractRepo = contractRepo;
        _userRepo = userRepo;
    }

    public async Task<List<string>> Handle(GetGridRentersQuery request, CancellationToken cancellationToken)
    {
        var contracts = await _contractRepo.GetByWarehouseIdAsync(request.WarehouseId);
        var activeRenterIds = contracts
            .Where(c => c.Status == "ACTIVE")
            .Select(c => c.RenterId)
            .Distinct()
            .ToList();

        var renters = new List<string>();
        foreach (var renterId in activeRenterIds)
        {
            var user = await _userRepo.GetByIdAsync(renterId, cancellationToken);
            if (user != null)
            {
                renters.Add(user.FullName);
            }
        }
            
        return renters;
    }
}
