import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import ContractCard from '../components/contract/ContractCard';
import ExtensionRequestModal from '../components/contract/ExtensionRequestModal';
import contractExtensionService from '../services/contractExtensionService';
import rentalService from '../services/rentalService';

const extStatusConfig = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Chờ duyệt' },
  APPROVED: { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#166534', label: 'Đã duyệt' },
  PENDING_PAYMENT: { bg: '#dbeafe', color: '#1d4ed8', label: 'Chờ thanh toán' },
  COMPLETED: { bg: '#e0e7ff', color: '#4338ca', label: 'Hoàn tất' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Đã từ chối' },
  CANCELLED: { bg: '#f1f5f9', color: '#64748b', label: 'Đã hủy' },
};

const RenterExtensionPage = () => {
  const [contracts, setContracts] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('contracts');
  const [extensionActionLoading, setExtensionActionLoading] = useState(null);

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const [contractsData, extensionsData] = await Promise.all([
        rentalService.getMyContracts(),
        contractExtensionService.getMyExtensions()
      ]);

      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setExtensions(Array.isArray(extensionsData) ? extensionsData : []);
    } catch (error) {
      message.error('Không thể tải dữ liệu: ' + ('Lỗi không xác định'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredContracts = contracts.filter(contract => {
    if (searchTerm &&
        !String(contract.contractNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        !String(contract.warehouseName || '').toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && contract.status !== statusFilter) return false;
    return true;
  });

  const handleExtensionRequest = useCallback((contract) => {
    const eligibility = contractExtensionService.checkExtensionEligibility(contract);
    if (!eligibility.eligible) { message.warning(eligibility.reason); return; }
    setSelectedContract(contract);
  }, []);

  const handleExtensionSuccess = useCallback(() => {
    loadData(true);
    message.success('Yêu cầu gia hạn đã được gửi thành công!');
  }, [loadData]);

  const handleRenterDecision = useCallback(async (extension, isAccepted) => {
    try {
      setExtensionActionLoading(extension.extensionId);
      if (isAccepted) {
        const result = await contractExtensionService.submitRenterDecision(extension.extensionId, true);
        message.success('Đã xác nhận gia hạn. Đang chuyển đến thanh toán...');
        window.location.href = result.redirectUrl;
        return;
      }
      // Từ chối / hủy - dùng cancelExtension cho cả APPROVED và PENDING_PAYMENT
      await contractExtensionService.cancelExtension(extension.extensionId);
      message.success('Đã hủy yêu cầu gia hạn.');
      loadData(true);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể xử lý yêu cầu');
    } finally {
      setExtensionActionLoading(null);
    }
  }, [loadData]);

  const pendingExtensionsCount = extensions.filter(ext => ext.status === 'PENDING').length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const contractsExpiringSoon = contracts.filter(c => {
    if (c.status !== 'ACTIVE') return false;
    const daysLeft = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000*60*60*24));
    return daysLeft <= 30 && daysLeft >= 0;
  }).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <div style={{ color: '#64748b', fontSize: '0.92rem' }}>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '0 2rem 3rem', maxWidth: 1200, margin: '0 auto',
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero Header ── */}
      <div style={{
        margin: '0 -2rem 28px -2rem',
        padding: '32px 40px 28px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)',
        borderRadius: '0 0 24px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(14,165,233,0.08)' }} />

        <h1 style={{
          fontSize: '1.65rem', fontWeight: 800, color: '#fff', margin: '0 0 6px',
          letterSpacing: '-0.02em', position: 'relative',
        }}>
          Quản lý hợp đồng
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', margin: 0, position: 'relative' }}>
          Quản lý hợp đồng thuê kho và yêu cầu gia hạn
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 20, position: 'relative', flexWrap: 'wrap' }}>
          {[
            { label: 'Đang hoạt động', value: activeContracts, valColor: '#4ade80' },
            { label: 'Sắp hết hạn', value: contractsExpiringSoon, valColor: '#fbbf24' },
            { label: 'Chờ duyệt', value: pendingExtensionsCount, valColor: '#38bdf8' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '10px 20px', borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.valColor }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: '#f1f5f9', borderRadius: 14, padding: 4,
        animation: 'fadeUp 0.3s ease both',
      }}>
        {[
          { key: 'contracts', label: `Hợp đồng của tôi (${contracts.length})` },
          { key: 'extensions', label: `Yêu cầu gia hạn (${extensions.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 11,
              border: 'none', fontWeight: 700, fontSize: '0.88rem',
              cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#0f172a' : '#64748b',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contracts Tab ── */}
      {activeTab === 'contracts' && (
        <div style={{ animation: 'fadeUp 0.35s ease both' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã hợp đồng hoặc tên kho..."
              style={{
                flex: 1, minWidth: 220, maxWidth: 360, padding: '10px 16px',
                borderRadius: 12, border: '1.5px solid #e2e8f0',
                fontSize: '0.88rem', outline: 'none', background: '#fff',
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#0ea5e9'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 16px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', fontSize: '0.88rem',
                outline: 'none', background: '#fff', color: '#475569', cursor: 'pointer',
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="PENDING_PAYMENT">Chờ thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                padding: '10px 20px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#475569', fontWeight: 600, fontSize: '0.88rem',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
            >
              {refreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          {/* Cards grid */}
          {filteredContracts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              background: '#fff', borderRadius: 18, border: '1px solid #eef1f6',
            }}>
              <div style={{ color: '#475569', fontSize: '1rem', fontWeight: 600 }}>
                Không tìm thấy hợp đồng nào
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
                Hãy thử với từ khóa hoặc bộ lọc khác
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {filteredContracts.map((contract, idx) => (
                <div key={contract.contractId} style={{ animation: `fadeUp 0.35s ease ${idx * 0.04}s both` }}>
                  <ContractCard
                    contract={contract}
                    onRequestExtension={handleExtensionRequest}
                    showExtensionButton={contract.status === 'ACTIVE'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Extensions Tab ── */}
      {activeTab === 'extensions' && (
        <div style={{ animation: 'fadeUp 0.35s ease both' }}>
          {extensions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              background: '#fff', borderRadius: 18, border: '1px solid #eef1f6',
            }}>
              <div style={{ color: '#475569', fontSize: '1rem', fontWeight: 600 }}>
                Chưa có yêu cầu gia hạn nào
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
                Yêu cầu gia hạn sẽ xuất hiện khi bạn gửi từ tab "Hợp đồng của tôi"
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {extensions.map((ext, idx) => {
                const st = extStatusConfig[ext.status] || { bg: '#f1f5f9', color: '#64748b', label: ext.status };
                const isActionable = ext.status === 'APPROVED' || ext.status === 'PENDING_PAYMENT';
                const canReject = ext.status === 'APPROVED' || ext.status === 'PENDING_PAYMENT';
                const isLoading = extensionActionLoading === ext.extensionId;

                return (
                  <div
                    key={ext.extensionId}
                    style={{
                      background: '#fff', borderRadius: 16, overflow: 'hidden',
                      border: '1px solid #eef1f6',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                      transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
                      animation: `fadeUp 0.35s ease ${idx * 0.04}s both`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Accent */}
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${st.color}, ${st.color}88)` }} />

                    <div style={{ padding: '1.2rem 1.4rem' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: 2 }}>
                            Gia hạn {ext.originalContract?.contractNumber || 'N/A'}
                          </div>
                          {ext.originalContract?.warehouseName && (
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              {ext.originalContract.warehouseName}
                            </div>
                          )}
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 16,
                          background: st.bg, color: st.color,
                          fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                        }}>
                          {st.label}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Thời gian</span>
                          <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                            {contractExtensionService.formatDuration(ext.durationMonths)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Ngày yêu cầu</span>
                          <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                            {contractExtensionService.formatDate(ext.requestedAt)}
                          </span>
                        </div>
                        {ext.reviewedAt && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Ngày duyệt</span>
                            <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                              {contractExtensionService.formatDate(ext.reviewedAt)}
                            </span>
                          </div>
                        )}
                        {ext.proposedMonthlyPayment > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Giá duyệt</span>
                            <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
                              {contractExtensionService.formatCurrency(ext.proposedMonthlyPayment)}/tháng
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Review notes */}
                      {ext.reviewNotes && (
                        <div style={{
                          padding: '8px 12px', borderRadius: 8,
                          background: '#f8fafc', fontSize: '0.8rem',
                          color: '#64748b', lineHeight: 1.5, marginBottom: 12,
                        }}>
                          Ghi chú: {ext.reviewNotes}
                        </div>
                      )}

                      {/* Actions */}
                      {isActionable && (
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', gap: 10 }}>
                          <button
                            onClick={() => handleRenterDecision(ext, true)}
                            disabled={isLoading}
                            style={{
                              flex: 1, padding: '9px 16px', borderRadius: 10, border: 'none',
                              background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                              color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 10px rgba(34,197,94,0.3)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isLoading ? 'Đang xử lý...' : ext.status === 'APPROVED' ? 'Đồng ý & thanh toán' : 'Tiếp tục thanh toán'}
                          </button>
                          {canReject && (
                            <button
                              onClick={() => handleRenterDecision(ext, false)}
                              disabled={isLoading}
                              style={{
                                padding: '9px 16px', borderRadius: 10,
                                border: '1.5px solid #fca5a5', background: '#fff',
                                color: '#dc2626', fontWeight: 700, fontSize: '0.82rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                            >
                              Từ chối
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Extension Request Modal */}
      {selectedContract && (
        <ExtensionRequestModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onSuccess={handleExtensionSuccess}
        />
      )}
    </div>
  );
};

export default RenterExtensionPage;
