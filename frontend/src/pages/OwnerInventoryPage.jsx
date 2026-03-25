import React, { useEffect, useState, useCallback } from 'react';
import renterAssetService from '../services/renterAssetService';
import { getMyWarehouses } from '../services/warehouseService';
import authService from '../services/authService';

const OwnerInventoryPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchRenter, setSearchRenter] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Lấy danh sách kho của owner / operator
  useEffect(() => {
    const ctx = authService.getWarehouseContext() || {};
    const whs = (ctx.warehouses || []).map(w => ({ id: w.warehouseId, name: w.warehouseName }));
    if (whs.length > 0) {
      setWarehouses(whs);
      setSelectedWarehouse(String(whs[0].id));
    } else {
      // Fallback: gọi API
      getMyWarehouses()
        .then(data => {
          const list = (data || []).map(w => ({ id: w.warehouseId, name: w.name }));
          setWarehouses(list);
          if (list.length > 0) setSelectedWarehouse(String(list[0].id));
        })
        .catch(() => {});
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    if (!selectedWarehouse) return;
    setLoading(true);
    setError('');
    try {
      const res = await renterAssetService.getWarehouseInventory(selectedWarehouse);
      setRows(res.data || []);
    } catch {
      setError('Không thể tải dữ liệu tồn kho. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filtered = rows.filter(r => {
    const nameOk = r.assetName?.toLowerCase().includes(search.toLowerCase());
    const renterOk = (r.renterName?.toLowerCase().includes(searchRenter.toLowerCase()) || r.renterEmail?.toLowerCase().includes(searchRenter.toLowerCase()));
    return nameOk && renterOk;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

  // Group by renter for badge count
  const renterSet = new Set(filtered.map(r => r.renterId));

  // Color based on qty
  const qtyBadge = (qty) => {
    if (qty === 0) return { bg: '#fee2e2', color: '#ef4444' };
    if (qty <= 10) return { bg: '#fff7ed', color: '#f97316' };
    return { bg: '#dcfce7', color: '#16a34a' };
  };

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Tồn kho hàng thuê
        </h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: 14 }}>
          Xem toàn bộ hàng hoá của người thuê đang lưu trong kho của bạn.
        </p>
      </div>

      {/* Bộ lọc */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
        background: '#fff', padding: '16px 20px', borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0'
      }}>
        {/* Chọn kho */}
        <select
          value={selectedWarehouse}
          onChange={e => setSelectedWarehouse(e.target.value)}
          style={{
            height: 40, border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 14, padding: '0 12px', background: '#f8fafc',
            color: '#374151', cursor: 'pointer', outline: 'none', minWidth: 220
          }}
        >
          <option value="">— Chọn kho —</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        {/* Tìm theo tên hàng */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#94a3b8', fontSize: 18
          }}>inventory_2</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hàng..."
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 12, height: 40,
              border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
              outline: 'none', boxSizing: 'border-box', background: '#f8fafc'
            }}
          />
        </div>

        {/* Tìm theo tên renter */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#94a3b8', fontSize: 18
          }}>person_search</span>
          <input
            value={searchRenter}
            onChange={e => setSearchRenter(e.target.value)}
            placeholder="Tìm theo người thuê..."
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 12, height: 40,
              border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
              outline: 'none', boxSizing: 'border-box', background: '#f8fafc'
            }}
          />
        </div>

        <button
          onClick={fetchInventory}
          style={{
            height: 40, padding: '0 18px', background: '#00b2d6', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Làm mới
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Người thuê', value: renterSet.size, icon: 'group', color: '#8b5cf6', bg: '#ede9fe' },
          { label: 'Loại hàng hoá', value: filtered.length, icon: 'inventory_2', color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Tổng số lượng', value: filtered.reduce((s, r) => s + r.quantity, 0).toLocaleString('vi-VN'), icon: 'numbers', color: '#16a34a', bg: '#dcfce7' },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: '1 1 160px', background: '#fff', borderRadius: 12, padding: '14px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: stat.color }}>{stat.icon}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bảng dữ liệu */}
      <div style={{
        background: '#fff', borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {!selectedWarehouse ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>warehouse</span>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>Vui lòng chọn kho để xem tồn kho.</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid #e2e8f0',
              borderTopColor: '#00b2d6', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
            }} />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#ef4444', display: 'block', marginBottom: 8 }}>error_outline</span>
            <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
            <button onClick={fetchInventory} style={{ marginTop: 8, padding: '8px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Thử lại</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>inventory_2</span>
            <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>Chưa có hàng hoá nào trong kho</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Tên tài sản', 'Đơn vị', 'Người thuê', 'Số lượng', 'Cập nhật lần cuối'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const badge = qtyBadge(row.quantity);
                return (
                  <tr key={row.inventoryId || i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{row.assetName}</div>
                      {row.description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{row.description}</div>}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#64748b', fontSize: 14 }}>
                      <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 500 }}>{row.unit}</span>
                      {row.weightPerUnit && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{row.weightPerUnit} kg/đơn vị</div>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: '#ede9fe',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#8b5cf6' }}>person</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{row.renterName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.renterEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        fontWeight: 700, fontSize: 15, padding: '4px 10px', borderRadius: 6,
                        background: badge.bg, color: badge.color
                      }}>
                        {row.quantity?.toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#94a3b8', fontSize: 13 }}>{formatDate(row.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default OwnerInventoryPage;
