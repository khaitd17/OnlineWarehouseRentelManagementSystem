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
};

export default receiptNoteService;
