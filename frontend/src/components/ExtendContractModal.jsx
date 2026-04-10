import React, { useState } from 'react';
import rentalService from '../services/rentalService';

/**
 * ExtendContractModal - Modal for extending contract with payment
 */
const ExtendContractModal = ({ 
  contract,
  isOpen,
  onClose,
  onExtensionSuccess 
}) => {
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !contract) return null;

  const monthlyPayment = contract.monthlyPayment || 0;
  const totalAmount = monthlyPayment * extensionMonths;
  const currentEndDate = new Date(contract.endDate);
  const newEndDate = new Date(currentEndDate);
  newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (extensionMonths < 1 || extensionMonths > 12) {
      setError('Số tháng gia hạn phải từ 1-12 tháng');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await rentalService.extendContract(contract.contractId, extensionMonths);
      
      if (result.success) {
        if (onExtensionSuccess) {
          onExtensionSuccess(result);
        }
        onClose();
      } else {
        setError(result.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gia hạn hợp đồng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Gia hạn hợp đồng</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contract Info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Hợp đồng</p>
            <p className="font-semibold">{contract.contractNumber}</p>
            
            <p className="text-sm text-gray-600 mt-2 mb-1">Ngày kết thúc hiện tại</p>
            <p className="font-semibold">{formatDate(contract.endDate)}</p>

            <p className="text-sm text-gray-600 mt-2 mb-1">Giá thuê hàng tháng</p>
            <p className="font-semibold text-blue-600">{formatCurrency(monthlyPayment)}</p>
          </div>

          {/* Extension Months */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tháng gia hạn <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={extensionMonths}
              onChange={(e) => setExtensionMonths(parseInt(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 1 tháng, tối đa 12 tháng</p>
          </div>

          {/* Calculation Summary */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Ngày kết thúc mới:</span>
              <span className="font-semibold text-blue-600">{formatDate(newEndDate)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Số tháng gia hạn:</span>
              <span className="font-semibold">{extensionMonths} tháng</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-200">
              <span className="font-semibold">Tổng thanh toán:</span>
              <span className="font-bold text-lg text-blue-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Info */}
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
            <p className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Sau khi gửi yêu cầu, bạn cần thanh toán trong vòng 48 giờ để hoàn tất gia hạn.</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendContractModal;
