import axiosClient from "./axiosClient";

const returnService = {
  // ── Warehouse Return APIs ──────────────────────────────────────────

  /**
   * Bắt đầu quy trình trả kho
   * @param {number} contractId
   * @returns {Promise} return record info
   */
  initiateReturn: async (contractId) => {
    const response = await axiosClient.post("/warehouse-returns/initiate", {
      contractId
    });
    return response.data;
  },

  /**
   * Lấy thông tin return theo contract
   * @param {number} contractId
   * @returns {Promise} return info
   */
  getReturnByContract: async (contractId) => {
    const response = await axiosClient.get(`/warehouse-returns/contract/${contractId}`);
    return response.data;
  },

  /**
   * Lấy return theo ID
   * @param {number} returnId
   * @returns {Promise} return details
   */
  getReturnById: async (returnId) => {
    const response = await axiosClient.get(`/warehouse-returns/${returnId}`);
    return response.data;
  },

  /**
   * Submit inspection checklist
   * @param {number} returnId
   * @param {Object} inspectionData - {isClean, isEquipmentIntact, isNoOutstandingDebt, notes, damageFee, penaltyFee}
   * @returns {Promise} updated return info
   */
  submitInspection: async (returnId, inspectionData) => {
    const response = await axiosClient.post(`/warehouse-returns/${returnId}/inspect`, inspectionData);
    return response.data;
  },

  /**
   * Upload ảnh kiểm tra kho
   * @param {number} returnId
   * @param {File[]} files - Danh sách file ảnh
   * @returns {Promise} uploaded image URLs
   */
  uploadReturnImages: async (returnId, files) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await axiosClient.post(
      `/warehouse-returns/${returnId}/upload-images`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  /**
   * Hoàn tất quy trình trả kho
   * @param {number} returnId
   * @returns {Promise} completion result
   */
  completeReturn: async (returnId) => {
    const response = await axiosClient.post(`/warehouse-returns/${returnId}/complete`);
    return response.data;
  },

  /**
   * Lấy danh sách returns cần xử lý (cho owner)
   * @returns {Promise} pending returns list
   */
  getPendingReturns: async () => {
    const response = await axiosClient.get("/warehouse-returns/pending");
    return response.data;
  },

  /**
   * Approve return đã kiểm tra (cho owner)
   * @param {number} returnId
   * @param {Object} approvalData - {notes}
   * @returns {Promise} approval result
   */
  approveReturn: async (returnId, approvalData = {}) => {
    const response = await axiosClient.post(`/warehouse-returns/${returnId}/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject return (cho owner)
   * @param {number} returnId
   * @param {Object} rejectionData - {reason, requiredActions}
   * @returns {Promise} rejection result
   */
  rejectReturn: async (returnId, rejectionData) => {
    const response = await axiosClient.post(`/warehouse-returns/${returnId}/reject`, rejectionData);
    return response.data;
  },

  // ── Utility Methods ──────────────────────────────────────────

  /**
   * Calculate total fees (damage + penalty)
   * @param {number} damageFee
   * @param {number} penaltyFee
   * @returns {number} total fees
   */
  calculateTotalFees: (damageFee = 0, penaltyFee = 0) => {
    return Number(damageFee) + Number(penaltyFee);
  },

  /**
   * Validate inspection data
   * @param {Object} data - inspection data
   * @returns {Object} {isValid, errors}
   */
  validateInspectionData: (data) => {
    const errors = [];

    if (typeof data.isClean !== "boolean") {
      errors.push("Vui lòng xác nhận tình trạng sạch sẽ của kho");
    }

    if (typeof data.isEquipmentIntact !== "boolean") {
      errors.push("Vui lòng xác nhận tình trạng thiết bị");
    }

    if (typeof data.isNoOutstandingDebt !== "boolean") {
      errors.push("Vui lòng xác nhận không có công nợ");
    }

    if (data.damageFee && (isNaN(data.damageFee) || data.damageFee < 0)) {
      errors.push("Phí bồi thường phải là số không âm");
    }

    if (data.penaltyFee && (isNaN(data.penaltyFee) || data.penaltyFee < 0)) {
      errors.push("Phí phạt phải là số không âm");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get return status display info
   * @param {string} status
   * @returns {Object} {text, color, description}
   */
  getStatusDisplay: (status) => {
    const statusMap = {
      'INITIATED': {
        text: 'Bắt đầu trả kho',
        color: 'blue',
        description: 'Đã khởi tao quy trình trả kho'
      },
      'INSPECTING': {
        text: 'Đang kiểm tra',
        color: 'orange',
        description: 'Đang tiến hành kiểm tra kho'
      },
      'PENDING_APPROVAL': {
        text: 'Chờ duyệt',
        color: 'yellow',
        description: 'Chờ owner phê duyệt kết quả kiểm tra'
      },
      'APPROVED': {
        text: 'Đã duyệt',
        color: 'green',
        description: 'Đã được phê duyệt, hoàn tất trả kho'
      },
      'REJECTED': {
        text: 'Từ chối',
        color: 'red',
        description: 'Bị từ chối, cần kiểm tra lại'
      },
      'COMPLETED': {
        text: 'Hoàn thành',
        color: 'green',
        description: 'Đã hoàn thành quy trình trả kho'
      }
    };

    return statusMap[status] || {
      text: status,
      color: 'gray',
      description: 'Trạng thái không xác định'
    };
  },

  /**
   * Check if inspection is complete
   * @param {Object} returnData - return object
   * @returns {boolean} true if inspection completed
   */
  isInspectionComplete: (returnData) => {
    return returnData.isClean !== null &&
           returnData.isEquipmentIntact !== null &&
           returnData.isNoOutstandingDebt !== null;
  },

  /**
   * Check if return has issues requiring fees
   * @param {Object} returnData - return object
   * @returns {boolean} true if has issues
   */
  hasReturnIssues: (returnData) => {
    return !returnData.isClean ||
           !returnData.isEquipmentIntact ||
           !returnData.isNoOutstandingDebt ||
           (returnData.damageFee && returnData.damageFee > 0) ||
           (returnData.penaltyFee && returnData.penaltyFee > 0);
  },

  /**
   * Format fee amount for display
   * @param {number} amount
   * @returns {string} formatted amount
   */
  formatFee: (amount) => {
    if (!amount || amount === 0) return "0 VND";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  /**
   * Generate return checklist items
   * @returns {Array} checklist items for inspection
   */
  getInspectionChecklist: () => {
    return [
      {
        key: 'isClean',
        label: 'Kho được dọn dẹp sạch sẽ',
        description: 'Không có rác thải, bụi bẩn hoặc mùi hôi'
      },
      {
        key: 'isEquipmentIntact',
        label: 'Thiết bị nguyên vẹn',
        description: 'Không bị hư hỏng, mất mát hoặc trầy xước'
      },
      {
        key: 'isNoOutstandingDebt',
        label: 'Không có công nợ',
        description: 'Đã thanh toán đầy đủ các khoản phí'
      }
    ];
  }
};

export default returnService;