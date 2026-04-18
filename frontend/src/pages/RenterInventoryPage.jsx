import React, { useEffect, useState, useCallback } from 'react';
import renterAssetService from '../services/renterAssetService';
import rentalService from '../services/rentalService';

const ACCENT = '#0ea5e9';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtQty  = n => (n ?? 0).toLocaleString('vi-VN');
const fmtDT   = d => d ? new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';

const QtyBadge = ({ qty }) => {
  const s = qty === 0
    ? { bg:'#fee2e2', color:'#dc2626', dot:'#ef4444', label:'Hết hàng' }
    : qty <= 10
    ? { bg:'#fff7ed', color:'#c2410c', dot:'#f97316', label: null }
    : { bg:'#dcfce7', color:'#15803d', dot:'#22c55e', label: null };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px 3px 8px', borderRadius:999, background:s.bg, color:s.color, fontWeight:700, fontSize:'0.82rem', border:`1px solid ${s.dot}40` }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
      {fmtQty(qty)}{s.label ? ` · ${s.label}` : ''}
    </span>
  );
};

/* ── Main ────────────────────────────────────────────────────── */
const RenterInventoryPage = () => {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [warehouses, setWarehouses] = useState([]);       // [{id, name}]
  const [activeWh,   setActiveWh]   = useState('');       // '' = tất cả

  /* Load warehouse list from active contracts */
  useEffect(() => {
    rentalService.getMyContracts()
      .then(data => {
        const unique = [];
        const seen   = new Set();
        (data || [])
          .filter(c => c.status === 'ACTIVE')
          .forEach(c => {
            if (!seen.has(c.warehouseId)) {
              seen.add(c.warehouseId);
              unique.push({ id: c.warehouseId, name: c.warehouseName });
            }
          });
        setWarehouses(unique);
      })
      .catch(() => {});
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await renterAssetService.getMyInventory(activeWh || undefined);
      setRows(Array.isArray(res.data) ? res.data : (res.data?.items ?? []));
    } catch {
      setError('Không thể tải dữ liệu tồn kho. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [activeWh]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  /* Filter by search */
  const filtered = rows.filter(r =>
    r.assetName?.toLowerCase().includes(search.toLowerCase())
  );

  /* Stats */
  const totalTypes = filtered.length;
  const totalQty   = filtered.reduce((s, r) => s + (r.quantity ?? 0), 0);
  const outOfStock = filtered.filter(r => r.quantity === 0).length;

  /* Unique warehouse set in current rows */
  const activeWhSet = new Set(filtered.map(r => r.warehouseId));

  const card = { background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };

  return (
    <div className="w-full flex-1 flex flex-col min-w-0"
      style={{ fontFamily:'Inter, sans-serif', maxWidth:1060, margin:'0 auto', paddingBottom:48 }}>
      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keytml slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .inv-row:hover   { background:#f8faff !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.7rem', fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>
          Tồn kho của tôi
        </h1>
        <p style={{ color:'#64748b', fontSize:'0.88rem', margin:0 }}>
          Danh sách hàng hoá đang lưu trữ tại các kho bạn đang thuê. Cập nhật tự động sau mỗi lần yêu cầu được xác nhận.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { icon:'inventory_2', label:'Loại hàng hóa',   val:totalTypes,                color:'#0ea5e9' },
          { icon:'tag', label:'Tổng số lượng',    val:totalQty.toLocaleString('vi-VN'), color:'#22c55e' },
          { icon:'warning', label:'Hết hàng',          val:outOfStock,               color:'#ef4444' },
        ].map(({icon,label,val,color})=>(
          <div key={label} style={{ ...card, padding:'18px 22px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: color }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.3rem' }}>{icon}</span>
            </div>
            <div>
              <p style={{ margin:0, fontSize:'0.75rem', color:'#64748b', fontWeight:500 }}>{label}</p>
              <p style={{ margin:0, fontSize:'1.75rem', fontWeight:900, color:'#0f172a', lineHeight:1.1 }}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Warehouse Pill Tabs ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        {/* Pills */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button
            onClick={() => { setActiveWh(''); setSearch(''); }}
            style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${activeWh===''?ACCENT:'#e2e8f0'}`, background:activeWh===''?ACCENT:'#fff', color:activeWh===''?'#fff':'#64748b', fontWeight:600, fontSize:'0.8rem', cursor:'pointer', transition:'all 0.15s' }}>
            Tất cả kho ({rows.length})
          </button>
          {warehouses.map(w => (
            <button key={w.id}
              onClick={() => { setActiveWh(w.id); setSearch(''); }}
              style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${String(activeWh)===String(w.id)?ACCENT:'#e2e8f0'}`, background:String(activeWh)===String(w.id)?ACCENT:'#fff', color:String(activeWh)===String(w.id)?'#fff':'#64748b', fontWeight:600, fontSize:'0.8rem', cursor:'pointer', transition:'all 0.15s' }}>
              {w.name}
            </button>
          ))}
        </div>

        {/* Search + refresh */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <span className="material-symbols-outlined" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize: '1.1rem' }}>search</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên hàng hóa..."
              style={{ padding:'8px 12px 8px 36px', borderRadius:10, border:'1.5px solid #e2e8f0', outline:'none', fontSize:'0.875rem', fontFamily:'Inter,sans-serif', width:220, transition:'border-color 0.2s' }}
              onFocus={e=>e.target.style.borderColor=ACCENT} onBlur={e=>e.target.style.borderColor='#e2e8f0'}
            />
          </div>
          <button onClick={fetchInventory}
            style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#64748b', fontSize:'0.83rem', fontWeight:600, display:'flex', alignItems:'center', gap:5, transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f1f5f9';e.currentTarget.style.borderColor='#cbd5e1';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';}}>
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={card}>
        {loading ? (
          <div style={{ padding:64, textAlign:'center', color:'#94a3b8' }}>
            <div style={{ fontSize:'2rem', marginBottom:10, animation:'spin 1.2s linear infinite', display:'inline-block' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>autorenew</span>
            </div>
            <div style={{ fontWeight:500 }}>Đang tải dữ liệu...</div>
          </div>
        ) : error ? (
          <div style={{ padding:64, textAlign:'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'2.5rem', marginBottom:10, color: '#dc2626' }}>warning</span>
            <p style={{ fontWeight:600, color:'#dc2626', margin:'0 0 12px' }}>{error}</p>
            <button onClick={fetchInventory}
              style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:72, textAlign:'center' }}>
            <div style={{ marginBottom:12 }}><span className="material-symbols-outlined" style={{ fontSize:'3rem', color: '#cbd5e1' }}>inventory_2</span></div>
            <p style={{ fontWeight:700, color:'#0f172a', margin:'0 0 6px', fontSize:'1rem' }}>Chưa có hàng hoá nào</p>
            <p style={{ color:'#94a3b8', fontSize:'0.87rem', margin:0 }}>
              Tạo yêu cầu nhập kho và đợi Staff xác nhận để theo dõi tồn kho tại đây.
            </p>
          </div>
        ) : (
          <>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {[['Hàng hóa', 'auto'], ['Đơn vị', '100px'], ['Kho lưu trữ', '180px'], ['Số lượng', '140px', 'center'], ['Cập nhật', '140px']].map(([h, w, align])=>(
                    <th key={h} style={{ padding:'11px 16px', textAlign:align||'left', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', textTransform:'uppercase', width:w }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.inventoryId || i} className="inv-row"
                    style={{ borderBottom:'1px solid #f1f5f9', background: row.quantity === 0 ? '#fff7f7' : 'transparent', transition:'background 0.15s' }}>
                    {/* Hàng hóa */}
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ fontWeight:700, color:'#0f172a', fontSize:'0.9rem' }}>{row.assetName}</div>
                      {row.description && <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>{row.description}</div>}
                    </td>
                    {/* Đơn vị */}
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ background:'#f1f5f9', borderRadius:6, padding:'3px 10px', fontSize:'0.78rem', fontWeight:600, color:'#475569' }}>
                        {row.unit || '—'}
                      </span>
                      {row.weightPerUnit && (
                        <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{row.weightPerUnit} kg/đv</div>
                      )}
                    </td>
                    {/* Kho */}
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <span style={{ fontSize:'0.85rem', color:'#334155', fontWeight:500 }}>{row.warehouseName || '—'}</span>
                      </div>
                    </td>
                    {/* Số lượng */}
                    <td style={{ padding:'13px 16px', textAlign:'center' }}>
                      <QtyBadge qty={row.quantity ?? 0} />
                    </td>
                    {/* Cập nhật */}
                    <td style={{ padding:'13px 16px', fontSize:'0.78rem', color:'#94a3b8' }}>
                      {fmtDT(row.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer summary */}
            <div style={{ padding:'10px 16px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>
                Hiển thị <strong style={{ color:'#64748b' }}>{filtered.length}</strong> loại hàng hóa
                {activeWhSet.size > 0 && ` · ${activeWhSet.size} kho`}
              </span>
              {outOfStock > 0 && (
                <span style={{ fontSize:'0.75rem', color:'#dc2626', fontWeight:600 }}>
                  Có {outOfStock} loại hết hàng
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RenterInventoryPage;
