import axiosClient from "./axiosClient";

const rentalService = {
  createRentalRequest: async (data) => {
    const response = await axiosClient.post("/rental-requests", data);
    return response.data;
  },

  getMyRentalRequests: async () => {
    const response = await axiosClient.get("/rental-requests/my-requests");
    return response.data;
  },

  getRentalRequestById: async (id) => {
    const response = await axiosClient.get(`/rental-requests/${id}`);
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await axiosClient.get("/rental-requests/pending");
    return response.data;
  },

  getOwnerRequests: async (status = null) => {
    const params = status ? { status } : {};
    const response = await axiosClient.get("/rental-requests/owner/all", { params });
    return response.data;
  },

  approveRentalRequest: async (id, data) => {
    const response = await axiosClient.post(`/rental-requests/${id}/approve`, data);
    return response.data;
  },

  rejectRentalRequest: async (id, data) => {
    const response = await axiosClient.post(`/rental-requests/${id}/reject`, data);
    return response.data;
  },

  cancelRentalRequest: async (id, reason = null) => {
    const response = await axiosClient.post(`/rental-requests/${id}/cancel`, { reason });
    return response.data;
  },

  sendRentalRequest: async (id) => {
    const response = await axiosClient.post(`/rental-requests/${id}/send`);
    return response.data;
  },

  // ── Contract APIs ──────────────────────────────────────────────
  getMyContracts: async () => {
    const response = await axiosClient.get("/rental-contracts/my-contracts");
    return response.data;
  },

  getContractById: async (id) => {
    const response = await axiosClient.get(`/rental-contracts/${id}`);
    return response.data;
  },

  getContractsByWarehouse: async (warehouseId) => {
    const response = await axiosClient.get(`/rental-contracts/warehouse/${warehouseId}`);
    return response.data;
  },

  // Get all contracts for owner (across all their warehouses)
  getContractsForOwner: async () => {
    try {
      // Import warehouseService dynamically to avoid circular dependency
      const warehouseService = (await import('./warehouseService')).default;

      // Get all owner's warehouses
      const warehouses = await warehouseService.getMyWarehouses();

      if (!Array.isArray(warehouses) || warehouses.length === 0) {
        return [];
      }

      // Get contracts for each warehouse in parallel
      const contractsArrays = await Promise.all(
        warehouses.map(warehouse =>
          rentalService.getContractsByWarehouse(warehouse.warehouseId)
            .catch(() => []) // If error, return empty array for this warehouse
        )
      );

      // Flatten and merge all contracts
      const allContracts = contractsArrays.flat();

      // Sort by createdAt descending
      return allContracts.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error("Error fetching owner contracts:", error);
      return [];
    }
  },

  // ── Contract Signing APIs ──────────────────────────────────────────
  ownerSignContract: async (contractId, signatureBase64) => {
    const response = await axiosClient.post(`/rental-contracts/${contractId}/owner-sign`, { signatureBase64 });
    return response.data;
  },

  sendContractOtp: async (contractId) => {
    const response = await axiosClient.post(`/rental-contracts/${contractId}/send-otp`);
    return response.data;
  },

  verifyContractOtp: async (contractId, otpCode) => {
    const response = await axiosClient.post(`/rental-contracts/${contractId}/verify-otp`, { otpCode });
    return response.data;
  },

  signContract: async (contractId, signatureBase64) => {
    const response = await axiosClient.post(`/rental-contracts/${contractId}/sign`, { signatureBase64 });
    return response.data;
  },

  getContractLogs: async (contractId) => {
    const response = await axiosClient.get(`/rental-contracts/${contractId}/logs`);
    return response.data;
  },

  uploadContractFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosClient.post("/upload/contract", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // { url: "/uploads/contracts/..." }
  },

  // ── Contract Extension APIs ──────────────────────────────────────────
  // OLD SYSTEM - Extension requests (require owner approval)
  requestContractExtension: async (data) => {
    const response = await axiosClient.post("/contract-extensions/request", data);
    return response.data;
  },

  reviewContractExtension: async (extensionId, data) => {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/review`, data);
    return response.data;
  },

  getContractExtensions: async (contractId) => {
    const response = await axiosClient.get(`/contract-extensions/contract/${contractId}`);
    return response.data;
  },

  // NEW SYSTEM - Direct extension with payment
  /**
   * Extend contract directly (creates payment immediately)
   * @param {number} contractId - Contract ID to extend
   * @param {number} extensionMonths - Number of months to extend
   * @returns {Promise} Extension payment info with QR code
   */
  extendContract: async (contractId, extensionMonths) => {
    const response = await axiosClient.post(`/rental-contracts/${contractId}/extend`, { 
      extensionMonths 
    });
    return response.data;
  },

  /**
   * Decline contract before signing
   * @param {number} contractId - Contract ID to decline
   * @param {string} reason - Reason for declining
   * @returns {Promise} Result
   */
  declineContract: async (contractId, reason) => {
    const response = await axiosClient.post(`/rental-contracts/${contractId}/decline`, { 
      reason 
    });
    return response.data;
  },

  // ── Contract Management APIs ──────────────────────────────────────────
  getContracts: async (params = {}) => {
    const response = await axiosClient.get("/contracts", { params });
    return response.data;
  },

  getContractHistory: async (contractId) => {
    const response = await axiosClient.get(`/contracts/${contractId}/history`);
    return response.data;
  },

  // ── Contract Actions APIs ──────────────────────────────────────────
  cancelContract: async (contractId, reason) => {
    const response = await axiosClient.post(`/contracts/${contractId}/cancel`, { reason });
    return response.data;
  },

  terminateContractEarly: async (contractId, reason, earlyTerminationFee) => {
    const response = await axiosClient.post(`/contracts/${contractId}/terminate`, {
      terminationReason: reason,
      earlyTerminationFee
    });
    return response.data;
  },

  // Approve termination or close request
  approveTermination: async (contractId) => {
    const response = await axiosClient.post(`/contracts/${contractId}/approve-termination`);
    return response.data;
  },

  // Reject termination or close request
  rejectTermination: async (contractId, rejectReason = '') => {
    const response = await axiosClient.post(`/contracts/${contractId}/reject-termination`, { rejectReason });
    return response.data;
  },

  // Request close contract (2-party approval)
  requestClose: async (contractId) => {
    const response = await axiosClient.post(`/contracts/${contractId}/request-close`);
    return response.data;
  },

  completeContract: async (contractId) => {
    const response = await axiosClient.post(`/contracts/${contractId}/complete`);
    return response.data;
  },

  closeContract: async (contractId) => {
    const response = await axiosClient.post(`/contracts/${contractId}/close`);
    return response.data;
  },

  // ── Contract Management & Download APIs ──────────────────────────────────────────

  /**
   * Download contract PDF
   * @param {number} contractId
   * @returns {Promise<Blob>} PDF file blob
   */
  downloadContractPdf: async (contractId) => {
    const response = await axiosClient.get(`/rental-contracts/${contractId}/download-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Get contract signing history
   * @param {number} contractId
   * @returns {Promise} Signing history with timestamps and signatures
   */
  getContractSigningHistory: async (contractId) => {
    const response = await axiosClient.get(`/rental-contracts/${contractId}/signing-history`);
    return response.data;
  },

  /**
   * Get detailed contract audit logs
   * @param {number} contractId
   * @returns {Promise} Complete audit trail
   */
  getContractAuditLogs: async (contractId) => {
    const response = await axiosClient.get(`/rental-contracts/${contractId}/audit-logs`);
    return response.data;
  },

  /**
   * Get contract status timeline
   * @param {number} contractId
   * @returns {Promise} Status change timeline
   */
  getContractTimeline: async (contractId) => {
    const response = await axiosClient.get(`/rental-contracts/${contractId}/timeline`);
    return response.data;
  },

  /**
   * Get contracts dashboard summary
   * @param {Object} filters - Optional filters
   * @returns {Promise} Dashboard statistics
   */
  getContractsDashboard: async (filters = {}) => {
    const response = await axiosClient.get("/rental-contracts/dashboard", { params: filters });
    return response.data;
  },

  /**
   * Search contracts with advanced filters
   * @param {Object} searchParams - {status, dateRange, warehouseId, etc.}
   * @returns {Promise} Filtered contract list
   */
  searchContracts: async (searchParams) => {
    const response = await axiosClient.post("/rental-contracts/search", searchParams);
    return response.data;
  },

  /**
   * Get contract performance metrics
   * @param {number} contractId
   * @returns {Promise} Usage statistics, payments, etc.
   */
  getContractMetrics: async (contractId) => {
    const response = await axiosClient.get(`/rental-contracts/${contractId}/metrics`);
    return response.data;
  },

  /**
   * Export contracts to Excel/CSV
   * @param {Object} exportParams - {format, dateRange, status}
   * @returns {Promise<Blob>} Export file
   */
  exportContracts: async (exportParams) => {
    const response = await axiosClient.post("/rental-contracts/export", exportParams, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ── Contract Utilities ──────────────────────────────────────────

  /**
   * Get contract status display info
   * @param {string} status
   * @returns {Object} {text, color, icon, description}
   */
  getContractStatusDisplay: (status) => {
    const statusMap = {
      'DRAFT': {
        text: 'Bản nháp',
        color: 'gray',
        icon: '📝',
        description: 'Hợp đồng đang được soạn thảo'
      },
      'PENDING_OWNER_SIGNATURE': {
        text: 'Chờ chủ kho ký',
        color: 'orange',
        icon: '✏️',
        description: 'Đang chờ chủ kho xác nhận và ký hợp đồng'
      },
      'PENDING_SIGNATURE': {
        text: 'Chờ người thuê ký',
        color: 'yellow',
        icon: '✍️',
        description: 'Đang chờ người thuê ký xác nhận'
      },
      'SIGNED': {
        text: 'Đã ký',
        color: 'blue',
        icon: '📋',
        description: 'Hợp đồng đã được ký, chờ thanh toán'
      },
      'PENDING_PAYMENT': {
        text: 'Chờ thanh toán',
        color: 'purple',
        icon: '💳',
        description: 'Chờ thanh toán để kích hoạt hợp đồng'
      },
      'ACTIVE': {
        text: 'Đang hiệu lực',
        color: 'green',
        icon: '✅',
        description: 'Hợp đồng đang được thực hiện'
      },
      'COMPLETED': {
        text: 'Đã hoàn thành',
        color: 'teal',
        icon: '🏁',
        description: 'Hợp đồng hết hạn, chờ trả kho'
      },
      'CLOSED': {
        text: 'Đã đóng',
        color: 'green',
        icon: '🔒',
        description: 'Hợp đồng đã hoàn tất và đóng'
      },
      'OVERDUE': {
        text: 'Quá hạn',
        color: 'red',
        icon: '⚠️',
        description: 'Quá hạn trả kho, cần xử lý'
      },
      'TERMINATED': {
        text: 'Đã chấm dứt',
        color: 'red',
        icon: '🚫',
        description: 'Hợp đồng bị chấm dứt sớm'
      },
      'CANCELLED': {
        text: 'Đã hủy',
        color: 'gray',
        icon: '❌',
        description: 'Hợp đồng đã bị hủy bỏ'
      },
      'EXPIRED': {
        text: 'Hết hạn',
        color: 'red',
        icon: '⏰',
        description: 'Hợp đồng đã hết hạn xử lý'
      }
    };

    return statusMap[status] || {
      text: status,
      color: 'gray',
      icon: '❓',
      description: 'Trạng thái không xác định'
    };
  },

  /**
   * Calculate contract duration in days, months
   * @param {string} startDate - ISO date string
   * @param {string} endDate - ISO date string
   * @returns {Object} {days, months, years}
   */
  calculateContractDuration: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const months = Math.floor(diffDays / 30);
    const years = Math.floor(months / 12);

    return {
      days: diffDays,
      months: months,
      years: years,
      formatted: years > 0
        ? `${years} năm ${months % 12} tháng`
        : months > 0
          ? `${months} tháng`
          : `${diffDays} ngày`
    };
  },

  /**
   * Calculate remaining contract time
   * @param {string} endDate - ISO date string
   * @returns {Object} {days, isExpired, formatted}
   */
  getRemainingTime: (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        days: 0,
        isExpired: true,
        formatted: 'Đã hết hạn'
      };
    }

    return {
      days: diffDays,
      isExpired: false,
      formatted: diffDays === 1
        ? 'Còn 1 ngày'
        : diffDays < 30
          ? `Còn ${diffDays} ngày`
          : `Còn ${Math.ceil(diffDays / 30)} tháng`
    };
  },

  /**
   * Format contract amount for display
   * @param {number} amount
   * @returns {string} Formatted amount
   */
  formatContractAmount: (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  /**
   * Generate contract PDF filename
   * @param {Object} contract
   * @returns {string} Filename
   */
  generateContractFilename: (contract) => {
    const date = new Date(contract.createdAt).toISOString().split('T')[0];
    return `HopDong_${contract.contractNumber}_${date}.pdf`;
  },

  /**
   * Check if user can perform action on contract
   * @param {Object} contract
   * @param {string} action - 'sign', 'cancel', 'terminate', 'extend'
   * @param {Object} user
   * @returns {Object} {allowed, reason}
   */
  checkContractAction: (contract, action, user) => {
    const userId = user.userId;
    const isOwner = contract.ownerId === userId;
    const isRenter = contract.renterId === userId;

    switch (action) {
      case 'sign':
        if (contract.status !== 'PENDING_SIGNATURE' || !isRenter) {
          return { allowed: false, reason: 'Không thể ký hợp đồng ở trạng thái này' };
        }
        break;

      case 'cancel':
        if (!['DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'PENDING_PAYMENT'].includes(contract.status)) {
          return { allowed: false, reason: 'Không thể hủy hợp đồng ở trạng thái này' };
        }
        break;

      case 'terminate':
        if (contract.status !== 'ACTIVE') {
          return { allowed: false, reason: 'Chỉ có thể chấm dứt hợp đồng đang hiệu lực' };
        }
        break;

      case 'extend':
        if (!['ACTIVE', 'COMPLETED'].includes(contract.status)) {
          return { allowed: false, reason: 'Không thể gia hạn hợp đồng ở trạng thái này' };
        }
        break;

      default:
        return { allowed: false, reason: 'Hành động không hợp lệ' };
    }

    return { allowed: true, reason: null };
  },

  /**
   * Filter contracts by multiple criteria
   * @param {Array} contracts
   * @param {Object} filters
   * @returns {Array} Filtered contracts
   */
  filterContracts: (contracts, filters) => {
    return contracts.filter(contract => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(contract.status)) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const contractDate = new Date(contract.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (contractDate < startDate || contractDate > endDate) return false;
      }

      // Warehouse filter
      if (filters.warehouseId) {
        if (contract.warehouseId !== filters.warehouseId) return false;
      }

      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        if (!contract.contractNumber.toLowerCase().includes(searchLower) &&
            !contract.warehouseName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }
};

export default rentalService;
