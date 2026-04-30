import React, { useState } from 'react';
import rentalService from '../services/rentalService';

/**
 * CancelRequestButton — cho phép người thuê hủy yêu cầu thuê kho.
 * Modal dùng inline style (không phụ thuộc Tailwind CSS).
 */
const CancelRequestButton = ({
  requestId,
  requestStatus,
  onCancelSuccess,
  onCancelError,
  variant = 'button',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);

  // Chỉ hiện với các trạng thái có thể hủy
  const cancellableStatuses = ['PENDING', 'DRAFT'];
  if (!cancellableStatuses.includes(requestStatus)) return null;

  const handleCancel = async () => {
    if (!reason.trim()) { setError('Vui lòng nhập lý do hủy.'); return; }
    setIsCancelling(true);
    setError(null);
    try {
      const result = await rentalService.cancelRentalRequest(requestId, reason);
      setShowModal(false);
      setReason('');
      if (onCancelSuccess) onCancelSuccess(result);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu.';
      // Nếu request đã được hủy rồi (stale UI), đóng modal và refresh danh sách
      if (msg.includes('CANCELLED') || msg.toLowerCase().includes('đã hủy')) {
        setShowModal(false);
        setReason('');
        if (onCancelSuccess) onCancelSuccess();
      } else {
        setError(msg);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => { setShowModal(false); setReason(''); setError(null); };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '10px 20px', borderRadius: 10,
          border: '1.5px solid #fca5a5', background: '#fef2f2',
          color: '#dc2626', fontWeight: 700, fontSize: '0.88rem',
          cursor: 'pointer', transition: 'all 0.18s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
      >
        Hủy yêu cầu
      </button>

      {/* Cancel Modal */}
      {showModal && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20,
              padding: '2rem 2rem 1.6rem', maxWidth: 440, width: '92%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              position: 'relative',
            }}
          >
            {/* Close X */}
            <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748b' }}>✕</button>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Hủy yêu cầu thuê kho</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b' }}>Sau khi hủy, yêu cầu sẽ không thể khôi phục.</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Lý do hủy <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => { setReason(e.target.value); setError(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isCancelling && reason.trim()) {
                      handleCancel();
                    }
                  }
                }}
                placeholder="Nhập lý do hủy yêu cầu..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: error ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
                  fontSize: '0.9rem', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6, color: '#0f172a',
                }}
                onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={handleClose}
                disabled={isCancelling}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling || !reason.trim()}
                style={{
                  padding: '10px 22px', borderRadius: 10, border: 'none',
                  background: isCancelling || !reason.trim() ? '#fca5a5' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                  cursor: isCancelling || !reason.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: isCancelling || !reason.trim() ? 'none' : '0 4px 14px rgba(220,38,38,0.35)',
                  transition: 'all 0.2s',
                }}
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
