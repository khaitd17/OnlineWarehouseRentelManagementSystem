import React from 'react';
import contractExtensionService from '../../services/contractExtensionService';

const ContractCard = ({
  contract,
  onRequestExtension,
  showExtensionButton = true
}) => {
  const eligibility = contractExtensionService.checkExtensionEligibility(contract);

  const endDate = new Date(contract.endDate);
  const today = new Date();
  const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const statusMap = {
    'ACTIVE': { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#16a34a', text: 'Đang hoạt động', accent: '#22c55e' },
    'NEGOTIATING': { bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#2563eb', text: 'Đang đàm phán', accent: '#3b82f6' },
    'REVISION_REQUESTED': { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706', text: 'Yêu cầu chỉnh sửa', accent: '#f59e0b' },
    'APPROVED_FOR_SIGNING': { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#16a34a', text: 'Sẵn sàng ký', accent: '#22c55e' },
    'PENDING_OWNER_SIGNATURE': { bg: '#fef3c7', color: '#d97706', text: 'Chờ chủ kho ký', accent: '#f59e0b' },
    'PENDING_RENTER_SIGNATURE': { bg: '#fef3c7', color: '#d97706', text: 'Chờ người thuê ký', accent: '#f59e0b' },
    'PENDING_PAYMENT': { bg: '#fef3c7', color: '#f59e0b', text: 'Chờ thanh toán', accent: '#f59e0b' },
    'SIGNED': { bg: '#dbeafe', color: '#2563eb', text: 'Đã ký', accent: '#3b82f6' },
    'COMPLETED': { bg: '#e0e7ff', color: '#6366f1', text: 'Đã hoàn thành', accent: '#6366f1' },
    'CLOSED': { bg: '#f1f5f9', color: '#64748b', text: 'Đã đóng', accent: '#94a3b8' },
    'TERMINATED': { bg: '#fee2e2', color: '#dc2626', text: 'Đã chấm dứt', accent: '#ef4444' },
    'CANCELLED': { bg: '#fee2e2', color: '#dc2626', text: 'Đã hủy', accent: '#ef4444' },
    'CANCELLED_BY_USER': { bg: '#fee2e2', color: '#dc2626', text: 'Người dùng hủy', accent: '#ef4444' },
    'EXPIRED': { bg: '#fef3c7', color: '#d97706', text: 'Hết hạn', accent: '#f59e0b' },
    'OVERDUE': { bg: '#fee2e2', color: '#dc2626', text: 'Quá hạn', accent: '#ef4444' },
  };

  const status = statusMap[contract.status] || { bg: '#f1f5f9', color: '#64748b', text: contract.status, accent: '#94a3b8' };
  const isActive = contract.status === 'ACTIVE';
  const isCancelled = ['CANCELLED', 'CANCELLED_BY_USER', 'TERMINATED'].includes(contract.status);

  const handleExtensionClick = (e) => {
    e.stopPropagation();
    if (eligibility.eligible && onRequestExtension) {
      onRequestExtension(contract);
    }
  };

  return (
    <div
      style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1px solid #eef1f6',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        height: '100%', display: 'flex', flexDirection: 'column',
        opacity: isCancelled ? 0.7 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Accent bar */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${status.accent}, ${status.accent}88)`,
      }} />

      <div style={{ padding: '1.2rem 1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
            {contract.contractNumber}
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: 16,
            background: status.bg, color: status.color,
            fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            {status.text}
          </span>
        </div>

        {/* Warehouse name */}
        {contract.warehouseName && (
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>
            {contract.warehouseName}
          </div>
        )}

        {/* Expiry alert */}
        {isActive && daysUntilEnd <= 7 && daysUntilEnd > 0 && (
          <div style={{
            padding: '6px 12px', borderRadius: 8, marginBottom: 10,
            background: '#fef3c7', border: '1px solid #fde68a',
            fontSize: '0.78rem', color: '#92400e', fontWeight: 600,
          }}>
            Sắp hết hạn trong {daysUntilEnd} ngày
          </div>
        )}

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {[
            { label: 'Ngày bắt đầu', value: contractExtensionService.formatDate(contract.startDate) },
            { label: 'Ngày kết thúc', value: contractExtensionService.formatDate(contract.endDate), warn: daysUntilEnd <= 7 },
            { label: 'Tiền thuê/tháng', value: contractExtensionService.formatCurrency(contract.monthlyPayment), bold: true },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{item.label}</span>
              <span style={{
                fontSize: '0.85rem', fontWeight: item.bold ? 700 : 600,
                color: item.warn ? '#dc2626' : '#0f172a',
              }}>
                {item.value}
              </span>
            </div>
          ))}

          {isActive && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Thời gian còn lại</span>
              <span style={{
                fontSize: '0.85rem', fontWeight: 700,
                color: daysUntilEnd <= 7 ? '#dc2626' : daysUntilEnd <= 30 ? '#f59e0b' : '#16a34a',
              }}>
                {daysUntilEnd > 0 ? `${daysUntilEnd} ngày` : 'Đã hết hạn'}
              </span>
            </div>
          )}
        </div>

        {/* Extension notice */}
        {!eligibility.eligible && isActive && (
          <div style={{
            marginTop: 10, padding: '6px 12px', borderRadius: 8,
            background: '#fef3c7', border: '1px solid #fde68a',
            fontSize: '0.76rem', color: '#92400e', lineHeight: 1.4,
          }}>
            {eligibility.reason}
          </div>
        )}

        {/* Extension button */}
        {showExtensionButton && isActive && (
          <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
            <button
              onClick={handleExtensionClick}
              disabled={!eligibility.eligible}
              style={{
                width: '100%', padding: '8px 16px', borderRadius: 10,
                border: eligibility.eligible ? 'none' : '1.5px solid #e2e8f0',
                background: eligibility.eligible
                  ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                  : '#f8fafc',
                color: eligibility.eligible ? '#fff' : '#94a3b8',
                fontWeight: 700, fontSize: '0.82rem',
                cursor: eligibility.eligible ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                boxShadow: eligibility.eligible ? '0 2px 10px rgba(14,165,233,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (eligibility.eligible) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.4)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = eligibility.eligible ? '0 2px 10px rgba(14,165,233,0.3)' : 'none'; }}
            >
              {eligibility.eligible ? 'Yêu cầu gia hạn' : 'Không thể gia hạn'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractCard;
