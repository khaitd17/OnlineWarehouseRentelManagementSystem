import axiosClient from "./axiosClient";

const paymentService = {
  // ── SePay Payment APIs ──────────────────────────────────────────

  /**
   * Tạo payment mới cho contract
   * @param {Object} data - {contractId, amount, paymentType}
   * @returns {Promise} payment info với paymentId, paymentCode, status
   */
  createPayment: async (data) => {
    const payload = { ...data };
    if (payload.amountOverride == null && payload.amount != null) {
      payload.amountOverride = payload.amount;
    }

    const response = await axiosClient.post("/payments/create", payload);
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

  /**
   * Tạo cash payment (thanh toán tiền mặt)
   * @param {Object} data - {contractId, amount, paymentType}
   * @returns {Promise} payment info
   */
  createCashPayment: async (data) => {
    const payload = { ...data };
    if (payload.amountOverride == null && payload.amount != null) {
      payload.amountOverride = payload.amount;
    }

    const response = await axiosClient.post("/payments/cash", payload);
    return response.data;
  },

  /**
   * Upload payment proof (image/pdf)
   * @param {File} file
   * @returns {Promise} { url }
   */
  uploadPaymentProof: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosClient.post("/upload/payment-proof", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Lấy danh sách thanh toán tiền mặt chờ xác nhận (cho chủ kho)
   * @returns {Promise} danh sách pending cash payments
   */
  getPendingCashPayments: async () => {
    const response = await axiosClient.get("/payments/pending-confirmation");
    return response.data;
  },

  /**
   * Lấy danh sách thanh toán tiền mặt của chủ kho (đã xác nhận + chưa xác nhận)
   * @returns {Promise} danh sách cash payments
   */
  getOwnerCashPayments: async () => {
    const response = await axiosClient.get("/payments/cash-confirmation-list");
    return response.data;
  },

  /**
   * Xác nhận thanh toán tiền mặt (cho chủ kho)
   * @param {number} paymentId
   * @param {boolean} isApproved
   * @param {string} rejectionReason - optional, khi từ chối
   * @returns {Promise} result
   */
  confirmCashPayment: async (paymentId, isApproved, rejectionReason = null) => {
    const response = await axiosClient.post(`/payments/${paymentId}/confirm`, {
      isApproved,
      rejectionReason
    });
    return response.data;
  },

  /**
   * Request renter to re-upload payment proof
   * @param {number} paymentId
   * @param {string|null} reason
   * @returns {Promise}
   */
  requestPaymentReupload: async (paymentId, reason = null) => {
    const response = await axiosClient.post(`/payments/${paymentId}/request-reupload`, {
      reason
    });
    return response.data;
  },

  /**
   * Retry payment (thanh toán lại khi thất bại/hết hạn)
   * @param {number} paymentId
   * @returns {Promise} new payment info with QR code
   */
  retryPayment: async (paymentId) => {
    const response = await axiosClient.post(`/payments/${paymentId}/retry`);
    return response.data;
  },

  /**
   * Get retry info for a payment
   * @param {number} paymentId
   * @returns {Promise} retry info (retryCount, maxRetry, canRetry)
   */
  getRetryInfo: async (paymentId) => {
    const response = await axiosClient.get(`/payments/${paymentId}/retry-info`);
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
  },

  /**
   * Check if payment can be retried
   * @param {string} status - payment status
   * @param {number} retryCount - current retry count
   * @param {number} maxRetry - maximum retries allowed
   * @returns {boolean} true if can retry
   */
  canRetryPayment: (status, retryCount, maxRetry = 3) => {
    const retryableStatuses = ['EXPIRED', 'FAILED', 'RETRY_PENDING'];
    return retryableStatuses.includes(status) && retryCount < maxRetry;
  }
};

export default paymentService;
