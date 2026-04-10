using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Behaviors;

public class WarehouseLockProtectionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IWarehouseRepository _repo;

    public WarehouseLockProtectionBehavior(IWarehouseRepository repo)
    {
        _repo = repo;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var typeName = typeof(TRequest).Name;

        // Only intercept WRITE commands
        if (typeName.StartsWith("Create") || typeName.StartsWith("Update") || typeName.StartsWith("Delete") || typeName.StartsWith("Submit") || typeName.StartsWith("Approve") || typeName.StartsWith("Reject"))
        {
            // Try to find WarehouseId property in request
            var propertyInfo = typeof(TRequest).GetProperty("WarehouseId");
            if (propertyInfo != null)
            {
                var val = propertyInfo.GetValue(request);
                if (val is int warehouseId && warehouseId > 0)
                {
                    var warehouse = await _repo.GetByIdAsync(warehouseId, cancellationToken);
                    if (warehouse != null && warehouse.Status == "LOCKED")
                    {
                        throw new InvalidOperationException("Kho này hiện đang bị KHÓA do hết hạn gói cước. Bạn không thể thực hiện thao tác chỉnh sửa.");
                    }
                }
            }
            else if (typeName.Contains("Warehouse"))
            {
                // If it's an update/delete warehouse command, the Id might be the warehouse id
                 var idProp = typeof(TRequest).GetProperty("Id");
                 if (idProp != null)
                 {
                     var val = idProp.GetValue(request);
                     if (val is int id && id > 0)
                     {
                         var warehouse = await _repo.GetByIdAsync(id, cancellationToken);
                         if (warehouse != null && warehouse.Status == "LOCKED")
                         {
                             throw new InvalidOperationException("Kho này hiện đang bị KHÓA do hết hạn gói cước. Bạn không thể thực hiện thao tác chỉnh sửa.");
                         }
                     }
                 }
            }
        }

        return await next();
    }
}
