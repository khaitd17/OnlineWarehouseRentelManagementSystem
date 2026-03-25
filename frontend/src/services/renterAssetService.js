import axiosClient from './axiosClient';

const renterAssetService = {
  /** Lấy danh sách tài sản (catalogue) của renter hiện tại */
  getMyAssets: () => axiosClient.get('/renter-assets'),

  /** Tạo tài sản mới */
  createAsset: (data) => axiosClient.post('/renter-assets', data),

  /**
   * Lấy tồn kho tại 1 warehouse cụ thể.
   * Trả về danh sách asset có qty > 0 tại warehouse đó.
   */
  getInventoryByWarehouse: (warehouseId) =>
    axiosClient.get(`/renter-assets/inventory?warehouseId=${warehouseId}`),
};

export default renterAssetService;
