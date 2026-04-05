import React, { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';

/**
 * PaymentRetryButton - Button to retry a failed/expired payment
 * Shows retry count and handles the retry flow
 */
const PaymentRetryButton = ({ paymentId, onRetrySuccess, onRetryError, className = '' }) => {
  const [retryInfo, setRetryInfo] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);

  // Load retry info on mount
  useEffect(() => {
    const loadRetryInfo = async () => {
      try {
        const info = await paymentService.getRetryInfo(paymentId);
        setRetryInfo(info);
      } catch (err) {
        console.error('Failed to load retry info:', err);
      }
    };

    if (paymentId) {
      loadRetryInfo();
    }
  }, [paymentId]);

  const handleRetry = async () => {
    if (!retryInfo?.canRetry) return;

    setIsRetrying(true);
    setError(null);

    try {
      const result = await paymentService.retryPayment(paymentId);
      
      if (result.success) {
        // Reload retry info
        const newInfo = await paymentService.getRetryInfo(paymentId);
        setRetryInfo(newInfo);
        
        if (onRetrySuccess) {
          onRetrySuccess(result);
        }
      } else {
        setError(result.message);
        if (onRetryError) {
          onRetryError(result.message);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi thử lại thanh toán';
      setError(errorMessage);
      if (onRetryError) {
        onRetryError(errorMessage);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't render if no retry info or can't retry
  if (!retryInfo) {
    return null;
  }

  const { canRetry, retryCount, maxRetry, status } = retryInfo;

  // Only show for retryable statuses
  const retryableStatuses = ['EXPIRED', 'FAILED', 'RETRY_PENDING', 'Expired', 'Failed'];
  if (!retryableStatuses.includes(status)) {
    return null;
  }

  return (
    <div className={`payment-retry-container ${className}`}>
      {canRetry ? (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRetrying ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xử lý...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Thanh toán lại ({retryCount}/{maxRetry})
            </>
          )}
        </button>
      ) : (
        <div className="text-red-600 text-sm">
          Đã hết số lần thanh toán lại ({retryCount}/{maxRetry})
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default PaymentRetryButton;
