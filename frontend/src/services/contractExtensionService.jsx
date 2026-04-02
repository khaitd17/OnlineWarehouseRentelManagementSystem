import axiosClient from './axiosClient';

class ContractExtensionService {
  // ── Contract Extension APIs ──────────────────────────────────────────

  /**
   * Yêu cầu gia hạn hợp đồng
   */
  async requestExtension(data) {
    const response = await axiosClient.post('/contract-extensions/request', data);
    return response.data;
  }

  /**
   * Lấy extension theo ID
   */
  async getExtensionById(extensionId) {
    const response = await axiosClient.get(`/contract-extensions/${extensionId}`);
    return response.data;
  }

  /**
   * Lấy tất cả extensions của contract
   */
  async getExtensionsByContract(contractId) {
    const response = await axiosClient.get(`/contract-extensions/contract/${contractId}`);
    return response.data;
  }

  /**
   * Lấy extensions đang chờ duyệt (cho owner)
   */
  async getPendingExtensions() {
    const response = await axiosClient.get('/contract-extensions/pending');
    return response.data;
  }

  /**
   * Lấy extensions đang chờ chữ ký owner
   */
  async getPendingSignatureExtensions() {
    const response = await axiosClient.get('/contract-extensions/pending-signature');
    return response.data;
  }

  /**
   * Owner review extension request
   */
  async reviewExtension(extensionId, data) {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/review`, data);
    return response.data;
  }

  /**
   * Approve extension
   */
  async approveExtension(extensionId, data = {}) {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/approve`, data);
    return response.data;
  }

  /**
   * Reject extension
   */
  async rejectExtension(extensionId, data) {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/reject`, data);
    return response.data;
  }

  /**
   * Cancel extension request (by renter)
   */
  async cancelExtension(extensionId) {
    const response = await axiosClient.post(`/contract-extensions/${extensionId}/cancel`);
    return response.data;
  }

  /**
   * Lấy lịch sử extensions của user
   */
  async getMyExtensions() {
    const response = await axiosClient.get('/contract-extensions/my-extensions');
    return response.data;
  }

  // ── Utility Methods ──────────────────────────────────────────────────

  /**
   * Calculate new contract end date
   */
  calculateNewEndDate(currentEndDate, durationMonths) {
    const endDate = new Date(currentEndDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  }

  /**
   * Calculate additional total cost
   */
  calculateAdditionalCost(monthlyPayment, durationMonths) {
    return monthlyPayment * durationMonths;
  }

  /**
   * Validate extension request data
   */
  validateExtensionRequest(data) {
    const errors = [];

    if (!data.contractId || data.contractId <= 0) {
      errors.push('Contract ID không hợp lệ');
    }

    if (!data.durationMonths || data.durationMonths <= 0 || data.durationMonths > 24) {
      errors.push('Thời gian gia hạn phải từ 1-24 tháng');
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.push('Lý do gia hạn phải có ít nhất 10 ký tự');
    }

    if (data.proposedStartDate) {
      const startDate = new Date(data.proposedStartDate);
      const today = new Date();
      if (startDate <= today) {
        errors.push('Ngày bắt đầu gia hạn phải sau ngày hiện tại');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get extension status display info
   */
  getStatusDisplay(status) {
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
  }

  /**
   * Check if extension can be cancelled
   */
  canCancelExtension(extension) {
    return extension.status === 'PENDING';
  }

  /**
   * Check if extension can be reviewed
   */
  canReviewExtension(extension) {
    return extension.status === 'PENDING';
  }

  /**
   * Format extension duration
   */
  formatDuration(months) {
    if (months === 1) return '1 tháng';
    if (months < 12) return `${months} tháng`;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) {
      return years === 1 ? '1 năm' : `${years} năm`;
    }

    return `${years} năm ${remainingMonths} tháng`;
  }

  /**
   * Generate extension summary
   */
  generateExtensionSummary(extension, contract) {
    const currentEndDate = new Date(contract.endDate);
    const newEndDate = this.calculateNewEndDate(contract.endDate, extension.durationMonths);
    const additionalCost = this.calculateAdditionalCost(contract.monthlyPayment, extension.durationMonths);

    return {
      currentEndDate: currentEndDate.toLocaleDateString('vi-VN'),
      newEndDate: newEndDate.toLocaleDateString('vi-VN'),
      durationText: this.formatDuration(extension.durationMonths),
      additionalCost,
      formattedCost: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(additionalCost),
      totalMonthsAfterExtension: extension.durationMonths +
        Math.ceil((currentEndDate.getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    };
  }

  /**
   * Get duration options for UI
   */
  getDurationOptions() {
    return [
      { value: 1, label: '1 tháng' },
      { value: 2, label: '2 tháng' },
      { value: 3, label: '3 tháng' },
      { value: 6, label: '6 tháng' },
      { value: 9, label: '9 tháng' },
      { value: 12, label: '12 tháng (1 năm)' },
      { value: 18, label: '18 tháng' },
      { value: 24, label: '24 tháng (2 năm)' },
    ];
  }

  /**
   * Get extension reasons templates
   */
  getReasonTemplates() {
    return [
      { value: '', label: '-- Chọn mẫu lý do --' },
      {
        value: 'Tiếp tục nhu cầu lưu trữ hàng hóa cho hoạt động kinh doanh',
        label: 'Tiếp tục kinh doanh'
      },
      {
        value: 'Mở rộng quy mô hoạt động, cần tiếp tục sử dụng kho',
        label: 'Mở rộng quy mô'
      },
      {
        value: 'Hài lòng với dịch vụ, muốn tiếp tục hợp tác',
        label: 'Hài lòng dịch vụ'
      },
      {
        value: 'Chưa tìm được địa điểm thay thế phù hợp',
        label: 'Chưa có địa điểm thay thế'
      },
    ];
  }

  /**
   * Check if contract is eligible for extension
   */
  checkExtensionEligibility(contract) {
    if (!contract) {
      return { eligible: false, reason: 'Hợp đồng không tồn tại' };
    }

    if (contract.status !== 'ACTIVE') {
      return { eligible: false, reason: 'Hợp đồng phải ở trạng thái ACTIVE' };
    }

    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd < 0) {
      return { eligible: false, reason: 'Hợp đồng đã hết hạn' };
    }

    if (daysUntilEnd > 90) {
      return { eligible: false, reason: 'Chỉ có thể gia hạn trong vòng 90 ngày trước khi hết hạn' };
    }

    return { eligible: true, reason: null };
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}

const contractExtensionService = new ContractExtensionService();
export default contractExtensionService;