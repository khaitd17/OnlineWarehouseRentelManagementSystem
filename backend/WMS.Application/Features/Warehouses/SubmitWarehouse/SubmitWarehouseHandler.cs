using MediatR;
using WMS.Domain.Interfaces;

public class SubmitWarehouseHandler : IRequestHandler<SubmitWarehouseCommand>
{
    private readonly IWarehouseRepository _repository;

    public SubmitWarehouseHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task Handle(SubmitWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _repository.GetByIdAsync(request.WarehouseId, cancellationToken);

        if (warehouse == null)
            throw new Exception("Warehouse not found");

        if (warehouse.Status != "HIDDEN" && warehouse.Status != "DRAFT")
            throw new Exception("Warehouse cannot be submitted in its current status");

        warehouse.Status = "PENDING";

        await _repository.UpdateAsync(warehouse, cancellationToken);
    }
}