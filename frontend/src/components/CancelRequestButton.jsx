import React, { useState } from 'react';
import rentalService from '../services/rentalService';

/**
 * CancelRequestButton - Button to cancel a rental request with reason
 */
const CancelRequestButton = ({ 
  requestId, 
  requestStatus,
  onCancelSuccess, 
  onCancelError,
  variant = 'button', // 'button' | 'link' | 'icon'
  className = '' 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);

  // Only show for cancellable statuses
  const cancellableStatuses = ['PENDING', 'APPROVED', 'PENDING_CONTRACT'];
  if (!cancellableStatuses.includes(requestStatus)) {
    return null;
  }

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }

    setIsCancelling(true);
    setError(null);

    try {
      const result = await rentalService.cancelRentalRequest(requestId, reason);
      setShowModal(false);
      setReason('');
      
      if (onCancelSuccess) {
        onCancelSuccess(result);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu';
      setError(errorMessage);
      if (onCancelError) {
        onCancelError(errorMessage);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const renderTrigger = () => {
    switch (variant) {
      case 'link':
        return (
          <button
            onClick={() => setShowModal(true)}
            className={`text-red-600 hover:text-red-800 hover:underline ${className}`}
          >
            Hủy yêu cầu
          </button>
        );
      case 'icon':
        return (
          <button
            onClick={() => setShowModal(true)}
            className={`p-2 text-red-600 hover:bg-red-50 rounded-full ${className}`}
            title="Hủy yêu cầu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        );
      default:
        return (
          <button
            onClick={() => setShowModal(true)}
            className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${className}`}
          >
            Hủy yêu cầu
          </button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}

      {/* Cancel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Hủy yêu cầu thuê kho</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do hủy yêu cầu..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                  setError(null);
                }}
                disabled={isCancelling}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelRequestButton;
