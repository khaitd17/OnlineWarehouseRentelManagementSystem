import axiosClient from "./axiosClient";

const contractExtensionService = {
  // ── Contract Extension APIs ──────────────────────────────────────────

  /**
   * Yêu cầu gia hạn hợp đồng
   * @param {Object} data - {contractId, durationMonths, reason, proposedStartDate}
   * @returns {Promise} extension request info
   */
  requestExtension: async (data) => {
    const response = await axiosClient.post("/contract-extensions/request", data);
    return response.data;
  },

  /**
   * Lấy extension theo ID
   * @param {number} extensionId
   * @returns {Promise} extension details
   */
  getExtensionById: async (extensionId) => {
    const response = await axiosClient.get(`/contract-extensions/${extensionId}`);
    return response.data;
  },

  /**
   * Lấy tất cả extensions của contract
   * @param {number} contractId
   * @returns {Promise} extensions list
   */
  getExtensionsByContract: async (contractId) => {
    const response = await axiosClient.get(`/contract-extensions/contract/${contractId}`);
    return response.data;
  },

  /**
   * Lấy extensions đang chờ duyệt (cho owner)
   * @returns {Promise} pending extensions
   */
  getPendingExtensions: async () => {
    const response = await axiosClient.get("/contract-extensions/pending");
    return response.data;
  },

  /**
   * Owner review extension request
   * @param {number} extensionId
   * @param {Object} data - {status: 'APPROVED'|'REJECTED', reason?, newMonthlyPayment?}
   * @returns {Promise} review result
   */
  reviewExtension: async (extensionId, data) => {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/review`, data);
    return response.data;
  },

  /**
   * Approve extension
   * @param {number} extensionId
   * @param {Object} data - {newMonthlyPayment?, notes?}
   * @returns {Promise} approval result
   */
  approveExtension: async (extensionId, data = {}) => {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/approve`, data);
    return response.data;
  },

  /**
   * Reject extension
   * @param {number} extensionId
   * @param {Object} data - {reason}
   * @returns {Promise} rejection result
   */
  rejectExtension: async (extensionId, data) => {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/reject`, data);
    return response.data;
  },

  /**
   * Cancel extension request (by renter)
   * @param {number} extensionId
   * @returns {Promise} cancellation result
   */
  cancelExtension: async (extensionId) => {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/cancel`);
    return response.data;
  },

  /**
   * Lấy lịch sử extensions của user
   * @returns {Promise} user's extensions history
   */
  getMyExtensions: async () => {
    const response = await axiosClient.get("/contract-extensions/my-extensions");
    return response.data;
  },

  // ── Utility Methods ──────────────────────────────────────────

  /**
   * Calculate new contract end date
   * @param {string} currentEndDate - ISO date string
   * @param {number} durationMonths
   * @returns {Date} new end date
   */
  calculateNewEndDate: (currentEndDate, durationMonths) => {
    const endDate = new Date(currentEndDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  },

  /**
   * Calculate additional total cost
   * @param {number} monthlyPayment
   * @param {number} durationMonths
   * @returns {number} total additional cost
   */
  calculateAdditionalCost: (monthlyPayment, durationMonths) => {
    return monthlyPayment * durationMonths;
  },

  /**
   * Validate extension request data
   * @param {Object} data
   * @returns {Object} {isValid, errors}
   */
  validateExtensionRequest: (data) => {
    const errors = [];

    if (!data.contractId || data.contractId <= 0) {
      errors.push("Contract ID không hợp lệ");
    }

    if (!data.durationMonths || data.durationMonths <= 0 || data.durationMonths > 24) {
      errors.push("Thời gian gia hạn phải từ 1-24 tháng");
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.push("Lý do gia hạn phải có ít nhất 10 ký tự");
    }

    if (data.proposedStartDate) {
      const startDate = new Date(data.proposedStartDate);
      const today = new Date();
      if (startDate <= today) {
        errors.push("Ngày bắt đầu gia hạn phải sau ngày hiện tại");
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get extension status display info
   * @param {string} status
   * @returns {Object} {text, color, description}
   */
  getStatusDisplay: (status) => {
    const statusMap = {
      'PENDING': {
        text: 'Chờ duyệt',
        color: 'orange',
        description: 'Yêu cầu gia hạn đang chờ owner duyệt'
      },
      'APPROVED': {
        text: 'Đã duyệt',
        color: 'green',
        description: 'Yêu cầu gia hạn đã được phê duyệt'
      },
      'REJECTED': {
        text: 'Từ chối',
        color: 'red',
        description: 'Yêu cầu gia hạn bị từ chối'
      },
      'CANCELLED': {
        text: 'Đã hủy',
        color: 'gray',
        description: 'Yêu cầu gia hạn đã bị hủy'
      },
      'EXPIRED': {
        text: 'Hết hạn',
        color: 'red',
        description: 'Yêu cầu gia hạn đã hết hạn xử lý'
      }
    };

    return statusMap[status] || {
      text: status,
      color: 'gray',
      description: 'Trạng thái không xác định'
    };
  },

  /**
   * Check if extension can be cancelled
   * @param {Object} extension
   * @returns {boolean}
   */
  canCancelExtension: (extension) => {
    return extension.status === 'PENDING';
  },

  /**
   * Check if extension can be reviewed
   * @param {Object} extension
   * @returns {boolean}
   */
  canReviewExtension: (extension) => {
    return extension.status === 'PENDING';
  },

  /**
   * Format extension duration
   * @param {number} months
   * @returns {string} formatted duration
   */
  formatDuration: (months) => {
    if (months === 1) return "1 tháng";
    if (months < 12) return `${months} tháng`;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) {
      return years === 1 ? "1 năm" : `${years} năm`;
    }

    return `${years} năm ${remainingMonths} tháng`;
  },

  /**
   * Generate extension summary
   * @param {Object} extension
   * @param {Object} contract
   * @returns {Object} summary info
   */
  generateExtensionSummary: (extension, contract) => {
    const currentEndDate = new Date(contract.endDate);
    const newEndDate = contractExtensionService.calculateNewEndDate(contract.endDate, extension.durationMonths);
    const additionalCost = contractExtensionService.calculateAdditionalCost(
      contract.monthlyPayment,
      extension.durationMonths
    );

    return {
      currentEndDate: currentEndDate.toLocaleDateString('vi-VN'),
      newEndDate: newEndDate.toLocaleDateString('vi-VN'),
      durationText: contractExtensionService.formatDuration(extension.durationMonths),
      additionalCost,
      formattedCost: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(additionalCost),
      totalMonthsAfterExtension: extension.durationMonths +
        Math.ceil((currentEndDate - new Date(contract.startDate)) / (1000 * 60 * 60 * 24 * 30))
    };
  },

  /**
   * Get extension reasons templates
   * @returns {Array} predefined reasons
   */
  getReasonTemplates: () => {
    return [
      {
        value: "business_expansion",
        label: "Mở rộng kinh doanh",
        template: "Do nhu cầu mở rộng kinh doanh, tôi cần tiếp tục sử dụng kho để lưu trữ thêm hàng hoá."
      },
      {
        value: "seasonal_business",
        label: "Kinh doanh theo mùa",
        template: "Do tính chất kinh doanh theo mùa, tôi cần gia hạn thêm để hoàn thành chu kỳ kinh doanh."
      },
      {
        value: "inventory_management",
        label: "Quản lý tồn kho",
        template: "Cần thêm thời gian để xử lý hàng tồn kho và sắp xếp lại quy trình logistics."
      },
      {
        value: "market_conditions",
        label: "Điều kiện thị trường",
        template: "Do thay đổi điều kiện thị trường, cần thêm thời gian để điều chỉnh chiến lược kinh doanh."
      },
      {
        value: "other",
        label: "Khác",
        template: "Lý do khác (vui lòng mô tả chi tiết)..."
      }
    ];
  },

  /**
   * Check if contract is eligible for extension
   * @param {Object} contract
   * @returns {Object} {eligible, reason}
   */
  checkExtensionEligibility: (contract) => {
    if (!contract) {
      return { eligible: false, reason: "Hợp đồng không tồn tại" };
    }

    if (contract.status !== 'ACTIVE') {
      return { eligible: false, reason: "Hợp đồng phải ở trạng thái ACTIVE" };
    }

    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd < 0) {
      return { eligible: false, reason: "Hợp đồng đã hết hạn" };
    }

    if (daysUntilEnd > 90) {
      return { eligible: false, reason: "Chỉ có thể gia hạn trong vòng 90 ngày trước khi hết hạn" };
    }

    return { eligible: true, reason: null };
  }
};

export default contractExtensionService;