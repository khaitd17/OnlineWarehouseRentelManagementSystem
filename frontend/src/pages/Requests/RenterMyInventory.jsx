import React, { useState, useEffect, useCallback } from 'react';
import inventoryService from '../../services/inventoryService';
import { getMyWarehouses } from '../../services/warehouseService';

/* ─────────────────────────────────────────────
   RenterMyInventory — Tài sản của tôi
   Route: /renter-inventory
   Chỉ dành cho RENTER
───────────────────────────────────────────── */

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flex: 1,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 24, color }}>{icon}</span>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{value}</p>
    </div>
  </div>
);

const RenterMyInventory = () => {
  const [rows, setRows]                = useState([]);
  const [loading, setLoading]          = useState(false);
  const [warehouseFilter, setWFilter]  = useState('');
  const [search, setSearch]            = useState('');
  const [myWarehouses, setMyWarehouses] = useState([]);

  useEffect(() => {
    getMyWarehouses()
      .then(d => setMyWarehouses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getRenterMyInventory(warehouseFilter || undefined);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search
    ? rows.filter(r =>
        r.assetName?.toLowerCase().includes(search.toLowerCase()) ||
        r.warehouseName?.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  const totalItems = filtered.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalTypes = new Set(filtered.map(r => r.assetId)).size;
  const totalWhs   = new Set(filtered.map(r => r.warehouseId)).size;

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tài sản của tôi</h1>
        <p className="text-slate-500 text-sm mt-1">Xem tất cả tài sản bạn đang lưu kho — số lượng tồn theo từng kho.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon="inventory_2"  label="Tổng số lượng"   value={totalItems}  color="#00b2d6" />
        <StatCard icon="category"     label="Loại tài sản"     value={totalTypes}  color="#8b5cf6" />
        <StatCard icon="warehouse"    label="Số kho lưu trữ"  value={totalWhs}    color="#10b981" />
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Tìm kiếm</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9ca3af' }}>search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tên tài sản, kho bãi..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px 9px 36px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: '0.875rem',
                  outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc',
                }}
              />
            </div>
          </div>

          {/* Warehouse Filter */}
          {myWarehouses.length > 0 && (
            <div style={{ minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Kho bãi</label>
              <select
                value={warehouseFilter}
                onChange={e => setWFilter(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: '0.875rem',
                  outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f8fafc', cursor: 'pointer',
                }}
              >
                <option value="">Tất cả kho</option>
                {myWarehouses.map(w => (
                  <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Tên tài sản', 'Đơn vị', 'Khối lượng/đv', 'Kho bãi', 'Tồn kho', 'Cập nhật'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '0.7rem', fontWeight: 700, color: '#00b2d6',
                    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>sync</span>
                  Đang tải...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 0', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 8 }}>inventory_2</span>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>Chưa có tài sản nào trong kho.</p>
                </td></tr>
              ) : filtered.map(row => (
                <tr key={row.inventoryId}
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{row.assetName}</p>
                    {row.description && <p style={{ margin: '2px 0 0', fontSize: '0.73rem', color: '#9ca3af' }}>{row.description}</p>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#374151' }}>{row.unit}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#374151' }}>
                    {row.weightPerUnit != null ? `${row.weightPerUnit} kg` : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#374151' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#f0f9ff', color: '#0284c7',
                      padding: '3px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warehouse</span>
                      {row.warehouseName}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 52, padding: '4px 12px', borderRadius: 999,
                      background: row.quantity > 0 ? '#d1fae5' : '#fee2e2',
                      color: row.quantity > 0 ? '#059669' : '#dc2626',
                      fontWeight: 700, fontSize: '0.875rem',
                    }}>
                      {row.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Hiển thị <strong style={{ color: '#111827' }}>{filtered.length}</strong> dòng tài sản
          </span>
        </div>
      </div>
    </div>
  );
};

export default RenterMyInventory;
