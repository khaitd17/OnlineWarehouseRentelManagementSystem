import React, { useEffect, useState, useCallback } from 'react';
import renterAssetService from '../services/renterAssetService';
import axiosClient from '../services/axiosClient';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtDT = d =>
  d ? new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';

const QtyBadge = ({ qty }) => {
  const s = qty === 0
    ? { bg:'#fee2e2', color:'#dc2626', dot:'#ef4444' }
    : qty <= 10
    ? { bg:'#fff7ed', color:'#c2410c', dot:'#f97316' }
    : { bg:'#dcfce7', color:'#15803d', dot:'#22c55e' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px 3px 8px', borderRadius:999, background:s.bg, color:s.color, fontWeight:700, fontSize:'0.82rem', border:`1px solid ${s.dot}40` }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot }}/>
      {(qty??0).toLocaleString('vi-VN')}
    </span>
  );
};

/* ── Sort icon ───────────────────────────────────────────────── */
const SortIcon = ({ field, sortKey, sortDir }) => {
  if (sortKey !== field) return <span style={{ color:'#cbd5e1', fontSize:'0.75rem', marginLeft:4 }}>⇅</span>;
  return <span style={{ color:'#0ea5e9', fontSize:'0.75rem', marginLeft:4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
};

/* ── Sortable header cell ────────────────────────────────────── */
const SortTh = ({ field, label, width, align, sortKey, sortDir, onSort }) => (
  <th
    onClick={() => onSort(field)}
    style={{
      padding:'11px 16px', textAlign:align||'left', fontSize:'0.68rem', fontWeight:700,
      color: sortKey === field ? '#0ea5e9' : '#94a3b8',
      letterSpacing:'0.06em', textTransform:'uppercase', width, cursor:'pointer',
      userSelect:'none', whiteSpace:'nowrap', transition:'color 0.15s'
    }}>
    {label}<SortIcon field={field} sortKey={sortKey} sortDir={sortDir}/>
  </th>
);

/* ── Main ────────────────────────────────────────────────────── */
const StaffInventoryPage = () => {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [warehouses,   setWarehouses]   = useState([]);
  const [selectedWh,   setSelectedWh]   = useState('');
  const [searchItem,   setSearchItem]   = useState('');
  const [searchRenter, setSearchRenter] = useState('');
  const [sortKey,      setSortKey]      = useState('assetName');
  const [sortDir,      setSortDir]      = useState('asc');

  useEffect(() => {
    axiosClient.get('/staff/my-warehouses')
      .then(res => {
        const list = (Array.isArray(res.data) ? res.data : [])
          .map(w => ({ id: String(w.warehouseId), name: w.warehouseName || w.name }));
        setWarehouses(list);
        if (list.length > 0) setSelectedWh(list[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchInventory = useCallback(async () => {
    if (!selectedWh) return;
    setLoading(true);
    setError('');
    try {
      const res = await renterAssetService.getWarehouseInventory(selectedWh);
      setRows(Array.isArray(res.data) ? res.data : (res.data?.items ?? []));
    } catch {
      setError('Không thể tải dữ liệu tồn kho. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [selectedWh]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleSort = (field) => {
    setSortDir(prev => sortKey === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortKey(field);
  };

  const filtered = rows.filter(r => {
    const nameOk   = r.assetName?.toLowerCase().includes(searchItem.toLowerCase());
    const renterOk = !searchRenter ||
      r.renterName?.toLowerCase().includes(searchRenter.toLowerCase()) ||
      r.renterEmail?.toLowerCase().includes(searchRenter.toLowerCase());
    return nameOk && renterOk;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va, vb;
    switch (sortKey) {
      case 'assetName':   va = (a.assetName||'').toLowerCase();  vb = (b.assetName||'').toLowerCase(); break;
      case 'quantity':    va = a.quantity ?? 0;                   vb = b.quantity ?? 0;                 break;
      case 'renterName':  va = (a.renterName||'').toLowerCase();  vb = (b.renterName||'').toLowerCase(); break;
      case 'updatedAt':   va = new Date(a.updatedAt||0).getTime(); vb = new Date(b.updatedAt||0).getTime(); break;
      default:            va = 0; vb = 0;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const renterSet  = new Set(filtered.map(r => r.renterId));
  const totalQty   = filtered.reduce((s, r) => s + (r.quantity ?? 0), 0);
  const outOfStock = filtered.filter(r => r.quantity === 0).length;

  const card   = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };
  const ACCENT = '#0ea5e9';
  const whName = warehouses.find(w => w.id === selectedWh)?.name || '';

  const SORT_COLS = [
    { field:'assetName',  label:'Hàng hóa',   width:'auto'  },
    { field:null,         label:'Đơn vị',      width:'100px' },
    { field:'renterName', label:'Người thuê',  width:'220px' },
    { field:'quantity',   label:'Số lượng',    width:'130px', align:'center' },
    { field:'updatedAt',  label:'Cập nhật',    width:'140px' },
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-w-0"
      style={{ fontFamily:'Inter, sans-serif', maxWidth:1100, margin:'0 auto', paddingBottom:48 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .staffinv-row:hover { background:#f8faff !important; }
        .staffinv-sort-th:hover { color:#0ea5e9 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:'1.7rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>Quản lí tồn kho</h1>
            <p style={{ color:'#64748b', fontSize:'0.88rem', margin:0 }}>
              Thông tin hàng hoá hiện có trong kho bạn được phụ trách. Dùng để đối chiếu khi thực hiện kiểm kê.
            </p>
          </div>
          {whName && (
            <span style={{ padding:'6px 16px', borderRadius:20, background:'#e0f7fa', color:'#0ea5e9', fontWeight:700, fontSize:'0.82rem', border:'1.5px solid #b2ebf2', alignSelf:'flex-start' }}>
              🏪 {whName}
            </span>
          )}
        </div>
      </div>

      {/* ── Warehouse Pills ── */}
      {warehouses.length > 1 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {warehouses.map(w => (
            <button key={w.id} onClick={() => { setSelectedWh(w.id); setSearchItem(''); setSearchRenter(''); }}
              style={{ padding:'7px 18px', borderRadius:20, border:`1.5px solid ${selectedWh===w.id?ACCENT:'#e2e8f0'}`, background:selectedWh===w.id?ACCENT:'#fff', color:selectedWh===w.id?'#fff':'#64748b', fontWeight:700, fontSize:'0.83rem', cursor:'pointer', transition:'all 0.15s' }}>
              🏪 {w.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { emoji:'👥', label:'Người thuê',    val: renterSet.size,                    color:'#8b5cf6' },
          { emoji:'📦', label:'Loại hàng hóa', val: filtered.length,                  color:ACCENT },
          { emoji:'🔢', label:'Tổng số lượng', val: totalQty.toLocaleString('vi-VN'), color:'#22c55e' },
        ].map(({emoji,label,val,color})=>(
          <div key={label} style={{ ...card, padding:'18px 22px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>{emoji}</div>
            <div>
              <p style={{ margin:0, fontSize:'0.75rem', color:'#64748b', fontWeight:500 }}>{label}</p>
              <p style={{ margin:0, fontSize:'1.75rem', fontWeight:900, color:'#0f172a', lineHeight:1.1 }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Sort indicator + Refresh ── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', flex:1 }}>
          <div style={{ position:'relative', flex:'1 1 200px', maxWidth:280 }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}>📦</span>
            <input value={searchItem} onChange={e=>setSearchItem(e.target.value)} placeholder="Tìm theo tên hàng..."
              style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px 9px 32px', borderRadius:10, border:'1.5px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
              onFocus={e=>e.target.style.borderColor=ACCENT} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
          <div style={{ position:'relative', flex:'1 1 200px', maxWidth:280 }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}>👤</span>
            <input value={searchRenter} onChange={e=>setSearchRenter(e.target.value)} placeholder="Tìm theo người thuê..."
              style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px 9px 32px', borderRadius:10, border:'1.5px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s' }}
              onFocus={e=>e.target.style.borderColor=ACCENT} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Sort indicator pill */}
          <span style={{ fontSize:'0.75rem', color:'#64748b', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, padding:'5px 10px', fontWeight:500 }}>
            Sắp xếp: <strong style={{ color:'#0ea5e9' }}>
              {SORT_COLS.find(c=>c.field===sortKey)?.label} {sortDir==='asc'?'↑':'↓'}
            </strong>
          </span>
          <button onClick={fetchInventory}
            style={{ padding:'9px 16px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#64748b', fontSize:'0.83rem', fontWeight:600, display:'flex', alignItems:'center', gap:5, transition:'all 0.15s', flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.borderColor='#cbd5e1';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={card}>
        {!selectedWh ? (
          <div style={{ padding:64, textAlign:'center', color:'#94a3b8' }}>
            <div style={{ fontSize:'3rem', marginBottom:10 }}>🏪</div>
            <div style={{ fontWeight:600 }}>Bạn chưa được giao phụ trách kho nào.</div>
          </div>
        ) : loading ? (
          <div style={{ padding:64, textAlign:'center', color:'#94a3b8' }}>
            <div style={{ fontSize:'2rem', marginBottom:10, animation:'spin 1.2s linear infinite', display:'inline-block' }}>⏳</div>
            <div style={{ fontWeight:500 }}>Đang tải dữ liệu...</div>
          </div>
        ) : error ? (
          <div style={{ padding:64, textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:10 }}>⚠️</div>
            <p style={{ fontWeight:600, color:'#dc2626', margin:'0 0 12px' }}>{error}</p>
            <button onClick={fetchInventory}
              style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontWeight:700, cursor:'pointer' }}>
              Thử lại
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding:72, textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>📦</div>
            <p style={{ fontWeight:700, color:'#0f172a', margin:'0 0 6px', fontSize:'1rem' }}>Kho chưa có hàng hoá</p>
            <p style={{ color:'#94a3b8', fontSize:'0.87rem', margin:0 }}>
              Chưa có yêu cầu nào được hoàn thành hoặc kho chưa có hàng lưu trữ.
            </p>
          </div>
        ) : (
          <>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                  {SORT_COLS.map(col => col.field ? (
                    <SortTh key={col.field} field={col.field} label={col.label} width={col.width}
                      align={col.align} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}/>
                  ) : (
                    <th key={col.label} style={{ padding:'11px 16px', textAlign:'left', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', textTransform:'uppercase', width:col.width }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.inventoryId||i} className="staffinv-row"
                    style={{ borderBottom:'1px solid #f1f5f9', background: row.quantity===0 ? '#fff7f7' : 'transparent', transition:'background 0.15s' }}>
                    {/* Hàng hóa */}
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ fontWeight:700, color:'#0f172a', fontSize:'0.9rem' }}>{row.assetName}</div>
                      {row.description && <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:2 }}>{row.description}</div>}
                    </td>
                    {/* Đơn vị */}
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ background:'#f1f5f9', borderRadius:6, padding:'3px 10px', fontSize:'0.78rem', fontWeight:600, color:'#475569' }}>{row.unit||'—'}</span>
                      {row.weightPerUnit && <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{row.weightPerUnit} kg/đv</div>}
                    </td>
                    {/* Người thuê */}
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.9rem' }}>👤</div>
                        <div>
                          <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#1e293b' }}>{row.renterName}</div>
                          <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{row.renterEmail}</div>
                        </div>
                      </div>
                    </td>
                    {/* Số lượng */}
                    <td style={{ padding:'13px 16px', textAlign:'center' }}>
                      <QtyBadge qty={row.quantity ?? 0}/>
                    </td>
                    {/* Cập nhật */}
                    <td style={{ padding:'13px 16px', fontSize:'0.78rem', color:'#94a3b8' }}>{fmtDT(row.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div style={{ padding:'10px 16px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>
                <strong style={{ color:'#64748b' }}>{sorted.length}</strong> loại hàng ·{' '}
                <strong style={{ color:'#64748b' }}>{renterSet.size}</strong> người thuê ·{' '}
                tổng <strong style={{ color:'#64748b' }}>{totalQty.toLocaleString('vi-VN')}</strong>
              </span>
              {outOfStock > 0 && (
                <span style={{ fontSize:'0.75rem', color:'#dc2626', fontWeight:600 }}>⚠ {outOfStock} loại hết hàng</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaffInventoryPage;
