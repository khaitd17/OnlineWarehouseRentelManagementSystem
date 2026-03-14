import axiosClient from './axiosClient';

const inventoryService = {
  /**
   * Owner lấy tất cả yêu cầu nhập/xuất kho của mình
   */
  getOwnerInventoryRequests: (params = {}) => {
    const { type = 'INBOUND', status, warehouseId, page = 1, pageSize = 10 } = params;
    const query = new URLSearchParams({ type, page, pageSize });
    if (status) query.append('status', status);
    if (warehouseId) query.append('warehouseId', warehouseId);
    return axiosClient.get(`/InventoryRequests/owner?${query.toString()}`);
  },

  /**
   * Renter / Staff lấy danh sách yêu cầu nhập/xuất kho
   * Backend tự phân quyền dựa trên JWT token (RENTER → của mình, STAFF → tất cả)
   */
  getInventoryRequests: (params = {}) => {
    const { type = 'INBOUND', status, warehouseId, page = 1, pageSize = 50 } = params;
    const query = new URLSearchParams({ type, page, pageSize });
    if (status) query.append('status', status);
    if (warehouseId) query.append('warehouseId', warehouseId);
    return axiosClient.get(`/InventoryRequests?${query.toString()}`);
  },

  /**
   * Renter tạo yêu cầu nhập hoặc xuất kho
   * payload: { warehouseId, type, notes, items: [{itemName, quantity, unit, description}] }
   */
  createInventoryRequest: (payload) => {
    return axiosClient.post('/InventoryRequests', payload);
  },

  /**
   * Xóa yêu cầu (chỉ khi PENDING, chỉ người tạo mới được xóa)
   */
  deleteInventoryRequest: (id) => {
    return axiosClient.delete(`/InventoryRequests/${id}`);
  },
};

export default inventoryService;
