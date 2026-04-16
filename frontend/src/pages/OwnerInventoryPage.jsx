import React, { useEffect, useState, useCallback } from 'react';
import renterAssetService from '../services/renterAssetService';
import { getMyWarehouses } from '../services/warehouseService';
import authService from '../services/authService';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtDT = d => d
  ? new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
  : '—';

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
      {qty === 0 && <span style={{ fontWeight:500 }}> · Hết</span>}
      {qty > 0 && qty <= 10 && <span style={{ fontWeight:500 }}> · Sắp hết</span>}
    </span>
  );
};

/* ── Main ────────────────────────────────────────────────────── */
const OwnerInventoryPage = () => {
  const [rows,            setRows]            = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [warehouses,      setWarehouses]      = useState([]);
  const [selectedWh,      setSelectedWh]      = useState('');
  const [searchItem,      setSearchItem]      = useState('');
  const [filterRenter,    setFilterRenter]    = useState('ALL');
  const [stockStatus,     setStockStatus]     = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK

  /* Load warehouse list — luôn fetch từ API để tránh stale cache */
  useEffect(() => {
    getMyWarehouses()
      .then(data => {
        const m = (data || [])
          .filter(w => w.status === 'APPROVED' || !w.status) // chỉ lấy kho đang hoạt động
          .map(w => ({ id: String(w.warehouseId || w.id), name: w.name || w.warehouseName }));
        setWarehouses(m);
        if (m.length > 0) setSelectedWh(m[0].id);
      })
      .catch(() => {
        // Fallback về localStorage cache nếu API lỗi
        const ctx  = authService.getWarehouseContext() || {};
        const list = (ctx.warehouses || []).map(w => ({ id: String(w.warehouseId), name: w.warehouseName }));
        setWarehouses(list);
        if (list.length > 0) setSelectedWh(list[0].id);
      });
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

  const filtered = rows.filter(r => {
    const nameOk   = r.assetName?.toLowerCase().includes(searchItem.toLowerCase());
    const renterOk = filterRenter === 'ALL' || String(r.renterId) === filterRenter;
    
    let stockOk = true;
    const q = r.quantity || 0;
    if (stockStatus === 'OUT_OF_STOCK') stockOk = q === 0;
    else if (stockStatus === 'LOW_STOCK') stockOk = q > 0 && q <= 10;
    else if (stockStatus === 'IN_STOCK') stockOk = q > 0;

    return nameOk && renterOk && stockOk;
  });

  /* Stats */
  const renterSet  = new Set(filtered.map(r => r.renterId));
  const totalQty   = filtered.reduce((s, r) => s + (r.quantity ?? 0), 0);
  const outOfStock = filtered.filter(r => r.quantity === 0).length;

  // Extract unique renters from all rows (not just filtered)
  const uniqueRenters = Array.from(new Map(rows.map(r => [r.renterId, { id: r.renterId, name: r.renterName }])).values());

  const card = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 4px 20px rgba(0,0,0,0.03)' };
  const ACCENT = '#0ea5e9';

  return (
    <div className="w-full flex-1 flex flex-col min-w-0"
      style={{ fontFamily:'Inter, sans-serif', maxWidth:1100, margin:'0 auto', paddingBottom:48 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .owninv-row:hover { background:#f8fafc !important; }
        .tab-btn { padding: 8px 20px; border-radius: 99px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; background: transparent; border: none; color: #64748b; }
        .tab-btn:hover { background: #f1f5f9; color: #334155; }
        .tab-btn.active { background: #0f172a; color: #fff; box-shadow: 0 4px 12px rgba(15,23,42,0.2); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:30, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <h1 style={{ fontSize:'2rem', fontWeight:900, color:'#0f172a', margin:'0 0 6px', letterSpacing:'-0.02em' }}>
            Tồn kho hàng thuê
          </h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem', margin:0 }}>
            Quản lý toàn bộ hàng hoá của Người thuê đang lưu trong các kho của bạn.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {[
          { icon:'group', label:'Người thuê',    val: renterSet.size,                       color:'#8b5cf6', bg:'#f5f3ff' },
          { icon:'category', label:'Mặt hàng',   val: filtered.length,                      color:ACCENT, bg:'#f0f9ff' },
          { icon:'inventory_2', label:'Tổng số lượng', val: totalQty.toLocaleString('vi-VN'), color:'#10b981', bg:'#f0fdf4' },
        ].map(({icon,label,val,color,bg})=>(
          <div key={label} style={{ ...card, padding:'20px 24px', display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:bg, display:'flex', alignItems:'center', justifyContent:'center', color:color, flexShrink:0 }}>
              <span className="material-symbols-outlined" style={{ fontSize:28 }}>{icon}</span>
            </div>
            <div>
              <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
              <p style={{ margin:'4px 0 0', fontSize:'1.85rem', fontWeight:900, color:'#0f172a', lineHeight:1 }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Warehouse Selection ── */}
      {warehouses.length > 1 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20, background:'#fff', padding:6, borderRadius:100, border:'1px solid #e2e8f0', width:'fit-content', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
          {warehouses.map(w => (
            <button key={w.id} className={`tab-btn ${selectedWh===w.id ? 'active' : ''}`}
              onClick={() => { setSelectedWh(w.id); setSearchItem(''); setFilterRenter('ALL'); setStockStatus('ALL'); }}>
              🏪 {w.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Data View ── */}
      <div style={{ ...card, padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        
        {/* ── Filter Toolbar ── */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', background:'#fafbcc', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', flex:1 }}>
            
            {/* Search item */}
            <div style={{ position:'relative', flex:'1 1 200px', maxWidth:280 }}>
              <span className="material-symbols-outlined" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:20 }}>search</span>
              <input value={searchItem} onChange={e=>setSearchItem(e.target.value)} placeholder="Tìm tên hàng hóa..."
                style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px 10px 38px', borderRadius:8, border:'1px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', transition:'border-color 0.2s', background:'#fff' }}
                onFocus={e=>e.target.style.borderColor=ACCENT} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
            
            {/* Renter Filter */}
            <div style={{ flexShrink:0 }}>
              <select value={filterRenter} onChange={e=>setFilterRenter(e.target.value)}
                style={{ width:'100%', minWidth:200, padding:'10px 36px 10px 14px', borderRadius:8, border:'1px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', background:'#fff', fontWeight:600, color:'#334155', cursor:'pointer', appearance:'none', backgroundImage:'url("data:image/svg+xml;utf8,<svg fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2364748b%27 xmlns=%27http://www.w3.org/2000/svg%27><path stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27></path></svg>")', backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', backgroundSize:'16px' }}>
                <option value="ALL">Tất cả người thuê</option>
                {uniqueRenters.map(r => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div style={{ flexShrink:0 }}>
              <select value={stockStatus} onChange={e=>setStockStatus(e.target.value)}
                style={{ padding:'10px 36px 10px 14px', borderRadius:8, border:'1px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', background:'#fff', fontWeight:600, color:'#334155', cursor:'pointer', appearance:'none', backgroundImage:'url("data:image/svg+xml;utf8,<svg fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2364748b%27 xmlns=%27http://www.w3.org/2000/svg%27><path stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27></path></svg>")', backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', backgroundSize:'16px' }}>
                <option value="ALL">Tất cả tình trạng</option>
                <option value="IN_STOCK">Còn hàng ({rows.filter(r=>r.quantity>0).length})</option>
                <option value="LOW_STOCK">Sắp hết ({rows.filter(r=>r.quantity>0 && r.quantity<=10).length})</option>
                <option value="OUT_OF_STOCK">Hết hàng ({rows.filter(r=>r.quantity===0).length})</option>
              </select>
            </div>

          </div>

          <button onClick={fetchInventory}
            style={{ padding:'10px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', color:'#475569', fontSize:'0.875rem', fontWeight:600, display:'flex', alignItems:'center', gap:6, transition:'all 0.15s', flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f8fafc';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}>
            <span className="material-symbols-outlined" style={{ fontSize:18 }}>refresh</span>
            Làm mới
          </button>
        </div>

        {/* ── Table Area ── */}
        <div style={{ minHeight:300 }}>
          {!selectedWh ? (
            <div style={{ padding:80, textAlign:'center', color:'#94a3b8' }}>
              <span className="material-symbols-outlined" style={{ fontSize:48, marginBottom:16, color:'#cbd5e1' }}>store</span>
              <div style={{ fontWeight:600, fontSize:'1.1rem', color:'#475569' }}>Vui lòng chọn kho để xem tồn kho.</div>
            </div>
          ) : loading ? (
            <div style={{ padding:80, textAlign:'center', color:'#94a3b8' }}>
              <span className="material-symbols-outlined" style={{ fontSize:40, marginBottom:16, animation:'spin 1s linear infinite', color:ACCENT }}>sync</span>
              <div style={{ fontWeight:500 }}>Đang tải dữ liệu...</div>
            </div>
          ) : error ? (
            <div style={{ padding:80, textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:48, marginBottom:16, color:'#ef4444' }}>error</span>
              <p style={{ fontWeight:600, color:'#dc2626', margin:'0 0 16px' }}>{error}</p>
              <button onClick={fetchInventory}
                style={{ padding:'10px 24px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontWeight:700, cursor:'pointer' }}>
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:80, textAlign:'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize:64, marginBottom:16, color:'#e2e8f0' }}>inventory_2</span>
              <p style={{ fontWeight:700, color:'#334155', margin:'0 0 8px', fontSize:'1.1rem' }}>Không tìm thấy hàng hoá nào</p>
              <p style={{ color:'#94a3b8', fontSize:'0.9rem', margin:0 }}>
                Bạn có thể thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                    {[['Hàng hóa','auto'],['Đơn vị','100px'],['Người thuê','240px'],['Số lượng','140px','center'],['Cập nhật','140px']].map(([h,w,align])=>(
                      <th key={h} style={{ padding:'14px 20px', textAlign:align||'left', fontSize:'0.75rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', width:w }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.inventoryId||i} className="owninv-row"
                      style={{ borderBottom:'1px solid #f1f5f9', background: row.quantity===0 ? '#fffafa' : '#fff', transition:'background 0.15s' }}>
                      {/* Hàng hóa */}
                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ fontWeight:700, color:'#0f172a', fontSize:'0.95rem' }}>{row.assetName}</div>
                        {row.description && <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:4 }}>{row.description}</div>}
                      </td>
                      {/* Đơn vị */}
                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ background:'#f1f5f9', borderRadius:6, padding:'4px 10px', fontSize:'0.8rem', fontWeight:600, color:'#334155' }}>
                          {row.unit||'—'}
                        </span>
                        {row.weightPerUnit && <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:6 }}>{row.weightPerUnit} kg/đv</div>}
                      </td>
                      {/* Người thuê */}
                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.renterName||'R')}&background=e2e8f0&color=475569`} alt="" style={{ width:36, height:36, borderRadius:'50%' }} />
                          <div>
                            <div style={{ fontSize:'0.875rem', fontWeight:700, color:'#1e293b' }}>{row.renterName}</div>
                            <div style={{ fontSize:'0.75rem', color:'#64748b' }}>{row.renterEmail}</div>
                          </div>
                        </div>
                      </td>
                      {/* Số lượng */}
                      <td style={{ padding:'16px 20px', textAlign:'center' }}>
                        <QtyBadge qty={row.quantity ?? 0}/>
                      </td>
                      {/* Cập nhật */}
                      <td style={{ padding:'16px 20px', fontSize:'0.8rem', color:'#64748b' }}>{fmtDT(row.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Table Footer ── */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', background:'#fafbcc', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.8rem', color:'#64748b' }}>
              Hiển thị <strong style={{ color:'#0f172a' }}>{filtered.length}</strong> hàng hoá
            </span>
            {outOfStock > 0 && stockStatus !== 'OUT_OF_STOCK' && (
              <span style={{ fontSize:'0.8rem', color:'#dc2626', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                <span className="material-symbols-outlined" style={{ fontSize:16 }}>warning</span>
                Có {outOfStock} loại mặt hàng đã hết
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default OwnerInventoryPage;

