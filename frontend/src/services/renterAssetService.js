import axiosClient from './axiosClient';

const renterAssetService = {
  /** Lấy danh sách tài sản (catalogue) của renter hiện tại */
  getMyAssets: () => axiosClient.get('/renter-assets'),

  /** Tạo tài sản mới */
  createAsset: (data) => axiosClient.post('/renter-assets', data),

  /**
   * Lấy tồn kho tại 1 warehouse cụ thể (API cũ).
   */
  getInventoryByWarehouse: (warehouseId) =>
    axiosClient.get(`/renter-assets/inventory?warehouseId=${warehouseId}`),

  /**
   * Renter xem tồn kho của mình (tất cả kho hoặc lọc theo warehouseId).
   */
  getMyInventory: (warehouseId) => {
    const url = warehouseId
      ? `/renter-assets/my-inventory?warehouseId=${warehouseId}`
      : '/renter-assets/my-inventory';
    return axiosClient.get(url);
  },

  /**
   * Owner / Operator / Manager xem tồn kho của tất cả renter trong 1 kho.
   */
  getWarehouseInventory: (warehouseId) =>
    axiosClient.get(`/renter-assets/warehouse-inventory?warehouseId=${warehouseId}`),

  /**
   * Lấy thông tin sức chứa (đã dùng / còn trống) tại 1 kho.
   */
  getCapacity: (warehouseId) =>
    axiosClient.get(`/renter-assets/capacity?warehouseId=${warehouseId}`),

  /**
   * Xóa bản ghi tồn kho có số lượng = 0 khỏi danh sách hiển thị.
   */
  deleteInventory: (inventoryId) =>
    axiosClient.delete(`/renter-assets/inventory/${inventoryId}`),
};

export default renterAssetService;
