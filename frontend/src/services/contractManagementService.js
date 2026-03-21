import axiosClient from "./axiosClient";
import { rentalService } from "./index";

const contractManagementService = {
  // ── Contract Dashboard ──────────────────────────────────────────

  /**
   * Get comprehensive contract dashboard
   * @returns {Promise} Dashboard data with statistics and charts
   */
  getDashboard: async () => {
    try {
      const [contracts, statistics, chartData] = await Promise.all([
        rentalService.getContracts({ page: 1, limit: 10 }),
        contractManagementService.getStatistics(),
        contractManagementService.getChartData()
      ]);

      return {
        contracts: contracts.data || [],
        statistics,
        chartData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error loading contract dashboard:", error);
      throw error;
    }
  },

  /**
   * Get contract statistics
   * @returns {Promise} Statistics summary
   */
  getStatistics: async () => {
    const response = await axiosClient.get("/rental-contracts/statistics");
    return response.data;
  },

  /**
   * Get chart data for contract analytics
   * @returns {Promise} Chart data
   */
  getChartData: async () => {
    const response = await axiosClient.get("/rental-contracts/chart-data");
    return response.data;
  },

  // ── Advanced Search & Filtering ──────────────────────────────────────────

  /**
   * Advanced contract search with multiple filters
   * @param {Object} searchCriteria
   * @returns {Promise} Search results
   */
  advancedSearch: async (searchCriteria) => {
    const {
      contractNumber,
      status,
      warehouseLocation,
      renterName,
      dateRange,
      amountRange,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = searchCriteria;

    const params = {
      contractNumber,
      status: status?.join(','),
      warehouseLocation,
      renterName,
      startDate: dateRange?.start,
      endDate: dateRange?.end,
      minAmount: amountRange?.min,
      maxAmount: amountRange?.max,
      sortBy,
      sortOrder,
      page,
      limit
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const response = await axiosClient.get("/rental-contracts/advanced-search", { params });
    return response.data;
  },

  /**
   * Get saved search filters for user
   * @returns {Promise} Saved filters
   */
  getSavedFilters: async () => {
    const response = await axiosClient.get("/rental-contracts/saved-filters");
    return response.data;
  },

  /**
   * Save search filter for future use
   * @param {Object} filter
   * @returns {Promise} Save result
   */
  saveFilter: async (filter) => {
    const response = await axiosClient.post("/rental-contracts/save-filter", filter);
    return response.data;
  },

  // ── Contract Lifecycle Management ──────────────────────────────────────────

  /**
   * Get contracts requiring attention (expiring, overdue, etc.)
   * @returns {Promise} Contracts needing action
   */
  getContractsRequiringAttention: async () => {
    const response = await axiosClient.get("/rental-contracts/requiring-attention");
    return response.data;
  },

  /**
   * Get contract renewal candidates
   * @param {number} daysBeforeExpiry - Default 30 days
   * @returns {Promise} Contracts eligible for renewal
   */
  getRenewalCandidates: async (daysBeforeExpiry = 30) => {
    const response = await axiosClient.get("/rental-contracts/renewal-candidates", {
      params: { daysBeforeExpiry }
    });
    return response.data;
  },

  /**
   * Bulk update contract status
   * @param {Array} contractIds
   * @param {string} newStatus
   * @param {string} reason
   * @returns {Promise} Update result
   */
  bulkUpdateStatus: async (contractIds, newStatus, reason) => {
    const response = await axiosClient.post("/rental-contracts/bulk-update-status", {
      contractIds,
      newStatus,
      reason
    });
    return response.data;
  },

  // ── Document Management ──────────────────────────────────────────

  /**
   * Get all documents for a contract
   * @param {number} contractId
   * @returns {Promise} Document list
   */
  getContractDocuments: async (contractId) => {
    const response = await axiosClient.get(`/rental-contracts/${contractId}/documents`);
    return response.data;
  },

  /**
   * Upload additional contract document
   * @param {number} contractId
   * @param {File} file
   * @param {string} documentType
   * @returns {Promise} Upload result
   */
  uploadContractDocument: async (contractId, file, documentType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await axiosClient.post(
      `/rental-contracts/${contractId}/upload-document`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  /**
   * Generate and download contract package (PDF + attachments)
   * @param {number} contractId
   * @returns {Promise<Blob>} ZIP file
   */
  downloadContractPackage: async (contractId) => {
    const response = await axiosClient.get(
      `/rental-contracts/${contractId}/download-package`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  // ── Analytics & Reporting ──────────────────────────────────────────

  /**
   * Get contract performance report
   * @param {Object} params - {dateRange, warehouseIds, status}
   * @returns {Promise} Performance report
   */
  getPerformanceReport: async (params) => {
    const response = await axiosClient.post("/rental-contracts/performance-report", params);
    return response.data;
  },

  /**
   * Get revenue analytics
   * @param {Object} params - {period, groupBy}
   * @returns {Promise} Revenue data
   */
  getRevenueAnalytics: async (params) => {
    const response = await axiosClient.post("/rental-contracts/revenue-analytics", params);
    return response.data;
  },

  /**
   * Export detailed contract report
   * @param {Object} params - {format, filters, columns}
   * @returns {Promise<Blob>} Export file
   */
  exportDetailedReport: async (params) => {
    const response = await axiosClient.post("/rental-contracts/export-report", params, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ── Notification & Alert Management ──────────────────────────────────────────

  /**
   * Get contract alerts and notifications
   * @returns {Promise} Alert list
   */
  getContractAlerts: async () => {
    const response = await axiosClient.get("/rental-contracts/alerts");
    return response.data;
  },

  /**
   * Mark alert as read
   * @param {number} alertId
   * @returns {Promise} Update result
   */
  markAlertAsRead: async (alertId) => {
    const response = await axiosClient.post(`/rental-contracts/alerts/${alertId}/read`);
    return response.data;
  },

  /**
   * Set up contract reminders
   * @param {number} contractId
   * @param {Object} reminderSettings
   * @returns {Promise} Setup result
   */
  setupContractReminders: async (contractId, reminderSettings) => {
    const response = await axiosClient.post(`/rental-contracts/${contractId}/set-reminders`, reminderSettings);
    return response.data;
  },

  // ── Utility Functions ──────────────────────────────────────────

  /**
   * Generate contract summary for display
   * @param {Object} contract
   * @returns {Object} Display-ready summary
   */
  generateContractSummary: (contract) => {
    const statusInfo = rentalService.getContractStatusDisplay(contract.status);
    const duration = rentalService.calculateContractDuration(contract.startDate, contract.endDate);
    const remaining = rentalService.getRemainingTime(contract.endDate);

    return {
      id: contract.contractId,
      number: contract.contractNumber,
      status: {
        code: contract.status,
        ...statusInfo
      },
      warehouse: {
        id: contract.warehouseId,
        name: contract.warehouseName,
        location: contract.warehouseLocation
      },
      renter: {
        id: contract.renterId,
        name: contract.renterName,
        email: contract.renterEmail
      },
      dates: {
        created: new Date(contract.createdAt).toLocaleDateString('vi-VN'),
        start: new Date(contract.startDate).toLocaleDateString('vi-VN'),
        end: new Date(contract.endDate).toLocaleDateString('vi-VN'),
        signed: contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('vi-VN') : null
      },
      duration: duration,
      remaining: remaining,
      financial: {
        monthlyPayment: rentalService.formatContractAmount(contract.monthlyPayment),
        totalAmount: rentalService.formatContractAmount(contract.totalAmount),
        depositAmount: contract.depositAmount ? rentalService.formatContractAmount(contract.depositAmount) : null
      },
      actions: contractManagementService.getAvailableActions(contract)
    };
  },

  /**
   * Get available actions for contract
   * @param {Object} contract
   * @returns {Array} Available actions
   */
  getAvailableActions: (contract) => {
    const actions = [];

    // View actions (always available)
    actions.push(
      { key: 'view', label: 'Xem chi tiết', icon: '👁️' },
      { key: 'download', label: 'Tải PDF', icon: '📄' },
      { key: 'history', label: 'Lịch sử', icon: '📋' }
    );

    // Status-specific actions
    switch (contract.status) {
      case 'PENDING_SIGNATURE':
        actions.push(
          { key: 'sign', label: 'Ký hợp đồng', icon: '✍️', primary: true },
          { key: 'cancel', label: 'Hủy', icon: '❌' }
        );
        break;

      case 'PENDING_PAYMENT':
        actions.push(
          { key: 'pay', label: 'Thanh toán', icon: '💳', primary: true },
          { key: 'cancel', label: 'Hủy', icon: '❌' }
        );
        break;

      case 'ACTIVE':
        actions.push(
          { key: 'extend', label: 'Gia hạn', icon: '📅' },
          { key: 'terminate', label: 'Chấm dứt', icon: '🚫' },
          { key: 'return', label: 'Trả kho', icon: '🏠' }
        );
        break;

      case 'COMPLETED':
        actions.push(
          { key: 'return', label: 'Trả kho', icon: '🏠', primary: true },
          { key: 'extend', label: 'Gia hạn', icon: '📅' }
        );
        break;
    }

    return actions;
  },

  /**
   * Validate contract data for display
   * @param {Object} contract
   * @returns {Object} {valid, errors}
   */
  validateContract: (contract) => {
    const errors = [];

    if (!contract.contractNumber) errors.push('Thiếu số hợp đồng');
    if (!contract.renterId) errors.push('Thiếu thông tin người thuê');
    if (!contract.warehouseId) errors.push('Thiếu thông tin kho');
    if (!contract.startDate || !contract.endDate) errors.push('Thiếu thông tin thời hạn');
    if (!contract.monthlyPayment || contract.monthlyPayment <= 0) errors.push('Thiếu thông tin giá thuê');

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Format contract for API submission
   * @param {Object} formData
   * @returns {Object} API-ready contract data
   */
  formatContractForApi: (formData) => {
    return {
      warehouseId: formData.warehouseId,
      renterId: formData.renterId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      monthlyPayment: parseFloat(formData.monthlyPayment),
      depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
      specialTerms: formData.specialTerms || null,
      notes: formData.notes || null
    };
  },

  /**
   * Check contract expiration status
   * @param {Object} contract
   * @returns {Object} Expiration info
   */
  checkExpirationStatus: (contract) => {
    const endDate = new Date(contract.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        priority: 'high',
        message: 'Hợp đồng đã hết hạn',
        action: 'return'
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        status: 'expiring_soon',
        priority: 'high',
        message: `Hợp đồng sắp hết hạn trong ${daysUntilExpiry} ngày`,
        action: 'extend_or_return'
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'expiring_within_month',
        priority: 'medium',
        message: `Hợp đồng hết hạn trong ${daysUntilExpiry} ngày`,
        action: 'consider_extension'
      };
    } else {
      return {
        status: 'active',
        priority: 'low',
        message: `Còn ${daysUntilExpiry} ngày`,
        action: null
      };
    }
  }
};

export default contractManagementService;