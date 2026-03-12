using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces
{
    public interface IStaffAssigmentRepository
    {
        //Task<StaffAssignment> AddAsync(StaffAssignment assignment,CancellationToken tk);
        //Task<List<StaffAssignmentDto>> GetStaffByWarehouseIdAsync(int warehouseId, CancellationToken tk = default);
        //Task<List<StaffAssignmentDto>> GetStaffByOwnerIdAsync(int ownerId, CancellationToken tk = default);
        //Task<int> GetTotalCountByWarehouseIdAsync(int warehouseId, CancellationToken tk = default);
        //Task<int> GetTotalCountByOwnerIdAsync(int ownerId, CancellationToken tk = default);
        //Task<List<StaffAssignmentDto>> SearchStaffByWarehouseIdAsync(int warehouseId, string searchKeyword, CancellationToken tk = default);
        //Task<List<StaffAssignmentDto>> SearchStaffByOwnerIdAsync(int ownerId, string searchKeyword, CancellationToken tk = default);
        //Task<int> GetTotalCountByWarehouseIdAndKeywordAsync(int warehouseId, string searchKeyword, CancellationToken tk = default);
        //Task<int> GetTotalCountByOwnerIdAndKeywordAsync(int ownerId, string searchKeyword, CancellationToken tk = default);
        //Task<bool> UpdateStaffAssignmentAsync(int assignmentId, DateOnly? endDate, string status, CancellationToken tk = default);
        //Task<bool> InactiveStaffAssignmentsByStaffIdAsync(int staffId, int? warehouseId, DateOnly? endDate, CancellationToken tk = default);
        //Task<StaffAssignment?> GetActiveAssignmentAsync(int staffId, int warehouseId, CancellationToken tk = default);
        //Task<List<StaffAssignment>> GetAllActiveAssignmentsByStaffIdAsync(int staffId, CancellationToken tk = default);
    }

    public record StaffAssignmentDto(
        int AssignmentId,
        int StaffId,
        int WarehouseId,
        string FullName,
        string Email,
        string? Phone,
        string? Status,
        DateOnly? AssignedAt,
        DateOnly? EndDate,
        string? Notes
    );
}
