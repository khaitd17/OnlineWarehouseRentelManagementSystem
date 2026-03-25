import React, { useEffect, useState, useCallback } from 'react';
import renterAssetService from '../services/renterAssetService';
import rentalService from '../services/rentalService';

const RenterInventoryPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Lấy danh sách kho từ hợp đồng đang active
  useEffect(() => {
    rentalService.getMyContracts()
      .then(data => {
        const active = (data || []).filter(c => c.status === 'ACTIVE');
        const whs = active.map(c => ({ id: c.warehouseId, name: c.warehouseName }));
        // Loại trùng
        const unique = whs.filter((w, i, arr) => arr.findIndex(x => x.id === w.id) === i);
        setWarehouses(unique);
      })
      .catch(() => {});
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await renterAssetService.getMyInventory(selectedWarehouse || undefined);
      setRows(res.data || []);
    } catch {
      setError('Không thể tải dữ liệu tồn kho. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filtered = rows.filter(r =>
    r.assetName?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

  const qtyColor = (qty) => {
    if (qty === 0) return '#ef4444';
    if (qty <= 10) return '#f97316';
    return '#16a34a';
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Tồn kho của tôi
        </h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: 14 }}>
          Danh sách hàng hoá đang lưu trữ tại các kho bạn đang thuê.
        </p>
      </div>

      {/* Bộ lọc */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
        background: '#fff', padding: '16px 20px', borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0'
      }}>
        {/* Tìm kiếm */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#94a3b8', fontSize: 18
          }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên tài sản..."
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 12, height: 40,
              border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
              outline: 'none', boxSizing: 'border-box', background: '#f8fafc'
            }}
          />
        </div>

        {/* Lọc theo kho */}
        <select
          value={selectedWarehouse}
          onChange={e => setSelectedWarehouse(e.target.value)}
          style={{
            height: 40, border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 14, padding: '0 12px', background: '#f8fafc',
            color: '#374151', cursor: 'pointer', outline: 'none', minWidth: 200
          }}
        >
          <option value="">— Tất cả kho —</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

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


      {/* Bảng dữ liệu */}
      <div style={{
        background: '#fff', borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {loading ? (
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
            <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>Không có hàng hoá nào</p>
            <p style={{ color: '#cbd5e1', fontSize: 13 }}>Hãy tạo yêu cầu nhập kho để bắt đầu theo dõi tồn kho.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Tên tài sản', 'Đơn vị', 'Kho', 'Số lượng', 'Cập nhật lần cuối'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.inventoryId || i} style={{
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: row.quantity === 0 ? '#fff7f7' : 'transparent',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = row.quantity === 0 ? '#fee2e2' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = row.quantity === 0 ? '#fff7f7' : 'transparent'}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#3b82f6' }}>warehouse</span>
                      <span style={{ fontSize: 13, color: '#374151' }}>{row.warehouseName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                    {row.quantity?.toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '13px 16px', color: '#94a3b8', fontSize: 13 }}>{formatDate(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RenterInventoryPage;
