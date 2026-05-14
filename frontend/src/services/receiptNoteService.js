import axiosClient from './axiosClient';

const receiptNoteService = {
  /**
   * Lấy tất cả phiếu nhập/xuất kho theo yêu cầu
   */
  getByRequest: (invReqId) =>
    axiosClient.get(`/ReceiptNotes/by-request/${invReqId}`),

  /**
   * Staff tạo phiếu nhập kho
   * payload: { invReqId, notes, staffSignatureBase64, items: [{ inventoryItemId, assetId, itemName, expectedQuantity, receivedQuantity, unit, verifiedVolume, verifiedWeight, note }] }
   */
  create: (payload) =>
    axiosClient.post('/ReceiptNotes', payload),

  /**
   * Renter xác nhận phiếu nhập kho (ký xác nhận)
   * payload: { renterSignatureBase64 }
   */
  confirm: (receiptNoteId, payload = {}) =>
    axiosClient.post(`/ReceiptNotes/${receiptNoteId}/confirm`, payload),

  /**
   * Manager phê duyệt phiếu vượt sức chứa
   */
  approveCapacity: (receiptNoteId) =>
    axiosClient.post(`/ReceiptNotes/${receiptNoteId}/approve-capacity`),

  /**
   * Manager từ chối phiếu vượt sức chứa
   */
  rejectCapacity: (receiptNoteId, reason) =>
    axiosClient.post(`/ReceiptNotes/${receiptNoteId}/reject-capacity`, { reason }),

  /**
   * Lấy danh sách phiếu chờ duyệt sức chứa tại 1 kho
   */
  getPendingCapacity: (warehouseId) =>
    axiosClient.get(`/ReceiptNotes/pending-capacity?warehouseId=${warehouseId}`),
};

export default receiptNoteService;
