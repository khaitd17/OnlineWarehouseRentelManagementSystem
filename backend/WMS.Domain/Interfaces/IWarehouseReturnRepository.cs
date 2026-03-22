using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces
{
    public interface IWarehouseReturnRepository
    {
        Task<WarehouseReturn?> GetByIdAsync(int returnId);
        Task<WarehouseReturn?> GetByContractIdAsync(int contractId);
        Task<List<WarehouseReturn>> GetListAsync();
        Task<int> AddAsync(WarehouseReturn warehouseReturn);
        Task UpdateAsync(WarehouseReturn warehouseReturn);
        Task DeleteAsync(int returnId);
        Task<List<WarehouseReturn>> GetByStatusAsync(string status);
        Task<bool> ExistsByContractIdAsync(int contractId);
        Task<List<WarehouseReturn>> GetPendingByWarehouseIdsAsync(List<int> warehouseIds);
    }
}