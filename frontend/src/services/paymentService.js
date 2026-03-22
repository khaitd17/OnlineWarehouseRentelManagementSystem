import axiosClient from "./axiosClient";

const paymentService = {
  // ── SePay Payment APIs ──────────────────────────────────────────

  /**
   * Tạo payment mới cho contract
   * @param {Object} data - {contractId, amount, paymentType}
   * @returns {Promise} payment info với paymentId, paymentCode, status
   */
  createPayment: async (data) => {
    const response = await axiosClient.post("/payments/create", data);
    return response.data;
  },

  /**
   * Lấy QR code info cho payment
   * @param {number} paymentId
   * @returns {Promise} QR info với VietQR URL
   */
  getPaymentQrInfo: async (paymentId) => {
    const response = await axiosClient.get(`/payments/${paymentId}/qr-info`);
    return response.data;
  },

  /**
   * Check payment status
   * @param {number} paymentId
   * @returns {Promise} payment status và details
   */
  getPaymentStatus: async (paymentId) => {
    const response = await axiosClient.get(`/payments/${paymentId}/status`);
    return response.data;
  },

  /**
   * Lấy tất cả payments của contract
   * @param {number} contractId
   * @returns {Promise} danh sách payments
   */
  getPaymentsByContract: async (contractId) => {
    const response = await axiosClient.get(`/payments/contract/${contractId}`);
    return response.data;
  },

  // ── Utility Methods ──────────────────────────────────────────

  /**
   * Format payment amount cho display
   * @param {number} amount
   * @returns {string} formatted amount (VD: "5,000,000 VND")
   */
  formatAmount: (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  /**
   * Generate payment description
   * @param {string} paymentCode
   * @param {string} type
   * @returns {string} description for payment
   */
  generateDescription: (paymentCode, type = 'MONTHLY') => {
    const typeMap = {
      'MONTHLY': 'Thanh toán hàng tháng',
      'DEPOSIT': 'Thanh toán tiền cọc',
      'EXTENSION': 'Thanh toán gia hạn hợp đồng'
    };
    return `${typeMap[type] || 'Thanh toán'} hợp đồng thuê kho ${paymentCode}`;
  },

  /**
   * Check if payment is expired
   * @param {string} expiredAt - ISO date string
   * @returns {boolean} true if expired
   */
  isPaymentExpired: (expiredAt) => {
    return new Date(expiredAt) < new Date();
  },

  /**
   * Get remaining time for payment
   * @param {string} expiredAt - ISO date string
   * @returns {Object} {hours, minutes, isExpired}
   */
  getRemainingTime: (expiredAt) => {
    const now = new Date();
    const expiry = new Date(expiredAt);
    const diff = expiry - now;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, isExpired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, isExpired: false };
  }
};

export default paymentService;