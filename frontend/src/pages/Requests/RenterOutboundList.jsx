import React, { useState } from "react";
import { Link } from "react-router-dom";

const INIT_DATA = [
  { id: "#OUT-2024", warehouse: "Kho Quận 7 - TP.HCM", item: "Laptop Dell XPS 15", qty: 20, unit: "Chiếc", destination: "Hà Nội Tech Center", shippingDate: "2024-11-22", status: "Đang chờ", created: "2024-11-12", notes: "Giao trong giờ hành chính" },
  { id: "#OUT-2023", warehouse: "Kho Sóng Thần - Bình Dương", item: "Màn hình Samsung 27\"", qty: 50, unit: "Chiếc", destination: "Đà Nẵng Office Park", shippingDate: "2024-11-19", status: "Đang giao", created: "2024-11-09", notes: "" },
  { id: "#OUT-2022", warehouse: "Kho Cảng Hải Phòng", item: "Bàn phím cơ Keychron", qty: 100, unit: "Chiếc", destination: "Berlin Global Tech Center", shippingDate: "2024-11-16", status: "Đã giao", created: "2024-11-06", notes: "" },
  { id: "#OUT-2021", warehouse: "Kho Hòa Lạc - Hà Nội", item: "Tai nghe Sony WH-1000XM5", qty: 30, unit: "Chiếc", destination: "TP.HCM Depot B", shippingDate: "2024-11-13", status: "Đã hủy", created: "2024-11-03", notes: "" },
  { id: "#OUT-2020", warehouse: "Kho Quận 7 - TP.HCM", item: "Ghế công thái học ErgoPlus", qty: 10, unit: "Chiếc", destination: "Cần Thơ Enterprise Zone", shippingDate: "2024-11-26", status: "Đang chờ", created: "2024-11-13", notes: "Cần xe tải lớn" },
  { id: "#OUT-2019", warehouse: "Kho Sóng Thần - Bình Dương", item: "Cáp HDMI 2.1", qty: 200, unit: "Chiếc", destination: "Đồng Nai Logistics Hub", shippingDate: "2024-11-29", status: "Từ chối", created: "2024-11-12", notes: "" },
];

const STATUS_CFG = {
  "Đang chờ": { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  "Đang giao": { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  "Đã giao":   { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  "Đã hủy":    { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
  "Từ chối":   { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

const Badge = ({ s }) => {
  const c = STATUS_CFG[s] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: c.dot, display: "inline-block" }} />{s}
    </span>
  );
};

const inputSt = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "0.875rem", fontFamily: "Inter,sans-serif", boxSizing: "border-box" };

const EditModal = ({ row, onClose, onSave }) => {
  const [f, setF] = useState({ ...row });
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%", maxWidth: "540px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Chỉnh sửa yêu cầu xuất kho</h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>{row.id}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.5rem", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Tên mặt hàng</label><input value={f.item} onChange={set("item")} style={inputSt} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Số lượng</label><input type="number" value={f.qty} onChange={set("qty")} style={inputSt} /></div>
            <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Đơn vị</label>
              <select value={f.unit} onChange={set("unit")} style={{ ...inputSt, appearance: "none" }}>{["Chiếc","Thùng","Pallet","Kiện"].map(u=><option key={u}>{u}</option>)}</select></div>
          </div>
          <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Địa chỉ điểm đến</label><input value={f.destination} onChange={set("destination")} placeholder="Nhập địa chỉ..." style={inputSt} /></div>
          <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Ngày xuất hàng</label><input type="date" value={f.shippingDate} onChange={set("shippingDate")} style={inputSt} /></div>
          <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Ghi chú</label><textarea value={f.notes} onChange={set("notes")} rows={3} style={{ ...inputSt, resize: "none" }} placeholder="Hướng dẫn giao hàng..." /></div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", color: "#64748b" }}>Hủy bỏ</button>
          <button onClick={() => onSave(f)} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#00b2d6", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};

const Confirm = ({ msg, label, danger, onOk, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
    <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
      <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: danger ? "#fee2e2" : "#e0f7fa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <span className="material-symbols-outlined" style={{ color: danger ? "#ef4444" : "#00b2d6", fontSize: "26px" }}>{danger ? "warning" : "help"}</span>
      </div>
      <p style={{ fontSize: "0.9rem", color: "#374151", margin: "0 0 22px" }}>{msg}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", color: "#64748b" }}>Không</button>
        <button onClick={onOk} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", backgroundColor: danger ? "#ef4444" : "#00b2d6", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>{label}</button>
      </div>
    </div>
  </div>
);

const STATUSES = ["Tất cả","Đang chờ","Đang giao","Đã giao","Đã hủy","Từ chối"];
const th = { padding: "11px 14px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", userSelect: "none", whiteSpace: "nowrap", cursor: "pointer" };
const td = { padding: "13px 14px", fontSize: "0.875rem", color: "#374151", borderBottom: "1px solid #f8fafc" };

export default function RenterOutboundList() {
  const [data, setData] = useState(INIT_DATA);
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState("Tất cả");
  const [editRow, setEditRow] = useState(null);
  const [conf, setConf] = useState(null);
  const [sel, setSel] = useState([]);
  const [sort, setSort] = useState({ k: "created", d: "desc" });

  const filtered = data
    .filter(r => {
      const q = search.toLowerCase();
      return (!q || [r.id,r.item,r.warehouse,r.destination].some(v=>v.toLowerCase().includes(q))) && (sf==="Tất cả"||r.status===sf);
    })
    .sort((a,b)=>{
      const [av,bv]=[a[sort.k],b[sort.k]];
      return sort.d==="asc"?(av>bv?1:-1):(av<bv?1:-1);
    });

  const toggleSel = id => setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const toggleAll = () => setSel(sel.length===filtered.length?[]:filtered.map(r=>r.id));
  const doSort = k => setSort(s=>({k,d:s.k===k&&s.d==="asc"?"desc":"asc"}));

  const save = f => { setData(d=>d.map(r=>r.id===f.id?{...r,...f}:r)); setEditRow(null); };
  const doCancel = id => { setData(d=>d.map(r=>r.id===id?{...r,status:"Đã hủy"}:r)); setConf(null); };
  const doDelete = id => { setData(d=>d.filter(r=>r.id!==id)); setSel(s=>s.filter(x=>x!==id)); setConf(null); };
  const bulkCancel = () => { setData(d=>d.map(r=>sel.includes(r.id)&&r.status==="Đang chờ"?{...r,status:"Đã hủy"}:r)); setSel([]); setConf(null); };
  const dup = row => { setData(d=>[{...row,id:`#OUT-${Math.floor(1000+Math.random()*9000)}`,status:"Đang chờ",created:new Date().toISOString().slice(0,10)},...d]); };
  const exportCSV = () => {
    const rows=[["ID","Kho","Mặt hàng","SL","Đơn vị","Điểm đến","Ngày xuất","Trạng thái","Ngày tạo"],...filtered.map(r=>[r.id,r.warehouse,r.item,r.qty,r.unit,r.destination,r.shippingDate,r.status,r.created])];
    const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n")); a.download="xuat-kho.csv"; a.click();
  };

  const SortIco = ({k}) => <span className="material-symbols-outlined" style={{fontSize:"13px",marginLeft:"3px",color:sort.k===k?"#00b2d6":"#cbd5e1",verticalAlign:"middle"}}>{sort.k===k?(sort.d==="asc"?"arrow_upward":"arrow_downward"):"unfold_more"}</span>;
  const counts = Object.fromEntries(STATUSES.slice(1).map(s=>[s,data.filter(r=>r.status===s).length]));

  return (
    <div style={{ fontFamily: "Inter,sans-serif" }} className="w-full flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"22px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 style={{ fontSize:"1.55rem", fontWeight:800, margin:0, color:"#111827" }}>Danh sách yêu cầu xuất kho</h1>
          <p style={{ margin:"6px 0 0", fontSize:"0.85rem", color:"#64748b" }}>Theo dõi và quản lý tất cả các yêu cầu xuất kho và vận chuyển của bạn.</p>
        </div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          <button onClick={exportCSV} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"9px 14px", borderRadius:"8px", border:"1px solid #e2e8f0", background:"#fff", fontWeight:600, fontSize:"0.8rem", cursor:"pointer", color:"#64748b" }}>
            <span className="material-symbols-outlined" style={{fontSize:"17px"}}>download</span>Xuất CSV
          </button>
          <Link to="/create-outbound" style={{ display:"flex", alignItems:"center", gap:"5px", padding:"9px 16px", borderRadius:"8px", backgroundColor:"#00b2d6", color:"#fff", fontWeight:700, fontSize:"0.875rem", textDecoration:"none" }}>
            <span className="material-symbols-outlined" style={{fontSize:"18px"}}>add</span>Tạo yêu cầu mới
          </Link>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"18px" }}>
        {Object.entries(counts).map(([s,n])=>{
          const c=STATUS_CFG[s]||{};
          return <button key={s} onClick={()=>setSf(s===sf?"Tất cả":s)} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"5px 12px", borderRadius:"20px", border:`1.5px solid ${sf===s?c.dot||"#00b2d6":"#e2e8f0"}`, backgroundColor:sf===s?(c.bg||"#e0f7fa"):"#fff", cursor:"pointer", fontWeight:600, fontSize:"0.78rem", color:sf===s?(c.color||"#00b2d6"):"#64748b", transition:"all 0.15s" }}>
            <span style={{ width:"6px",height:"6px",borderRadius:"50%",backgroundColor:c.dot||"#64748b",display:"inline-block" }}/>{s} <strong>{n}</strong>
          </button>;
        })}
      </div>

      {/* Search bar */}
      <div style={{ backgroundColor:"#fff", borderRadius:"12px", border:"1px solid #f1f5f9", padding:"12px 14px", marginBottom:"14px", display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
          <span className="material-symbols-outlined" style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", fontSize:"18px", color:"#94a3b8" }}>search</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo ID, mặt hàng, kho, điểm đến..." style={{ width:"100%", padding:"9px 12px 9px 36px", borderRadius:"8px", border:"1px solid #e2e8f0", outline:"none", fontSize:"0.875rem", boxSizing:"border-box" }} />
        </div>
        <div style={{ position:"relative" }}>
          <select value={sf} onChange={e=>setSf(e.target.value)} style={{ padding:"9px 32px 9px 12px", borderRadius:"8px", border:"1px solid #e2e8f0", outline:"none", fontSize:"0.875rem", appearance:"none", backgroundColor:"#fff", cursor:"pointer" }}>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
          <span className="material-symbols-outlined" style={{ position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)", fontSize:"17px", color:"#94a3b8", pointerEvents:"none" }}>expand_more</span>
        </div>
        {(search||sf!=="Tất cả")&&<button onClick={()=>{setSearch("");setSf("Tất cả");}} style={{ padding:"9px 12px", borderRadius:"8px", border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:"0.8rem", color:"#64748b", fontWeight:600 }}>Xóa lọc</button>}
      </div>

      {/* Bulk */}
      {sel.length>0&&(
        <div style={{ backgroundColor:"#e0f7fa", border:"1px solid #b2ebf2", borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
          <span style={{ fontSize:"0.875rem", fontWeight:700, color:"#00838f" }}>Đã chọn {sel.length}</span>
          <button onClick={()=>setConf({type:"bulk"})} style={{ padding:"6px 14px", borderRadius:"7px", border:"none", backgroundColor:"#ef4444", color:"#fff", fontWeight:700, fontSize:"0.8rem", cursor:"pointer" }}>Hủy đã chọn</button>
          <button onClick={()=>setSel([])} style={{ padding:"6px 14px", borderRadius:"7px", border:"1px solid #b2ebf2", background:"transparent", fontWeight:600, fontSize:"0.8rem", cursor:"pointer", color:"#00838f" }}>Bỏ chọn</button>
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor:"#fff", borderRadius:"12px", border:"1px solid #f1f5f9", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ backgroundColor:"#f8fafc" }}>
                <th style={{...th,width:"40px"}}><input type="checkbox" checked={sel.length===filtered.length&&filtered.length>0} onChange={toggleAll} style={{cursor:"pointer"}}/></th>
                <th style={th} onClick={()=>doSort("id")}>ID <SortIco k="id"/></th>
                <th style={th}>Kho xuất</th>
                <th style={th} onClick={()=>doSort("item")}>Mặt hàng <SortIco k="item"/></th>
                <th style={{...th,textAlign:"right"}}>Số lượng</th>
                <th style={th}>Điểm đến</th>
                <th style={th} onClick={()=>doSort("shippingDate")}>Ngày xuất <SortIco k="shippingDate"/></th>
                <th style={th}>Trạng thái</th>
                <th style={{...th,textAlign:"center"}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?(
                <tr><td colSpan={9} style={{ padding:"48px", textAlign:"center", color:"#94a3b8" }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"40px", display:"block", marginBottom:"8px" }}>outbox</span>Không tìm thấy yêu cầu nào
                </td></tr>
              ):filtered.map(row=>(
                <tr key={row.id} style={{ backgroundColor:sel.includes(row.id)?"#f0fdfa":"#fff" }}>
                  <td style={td}><input type="checkbox" checked={sel.includes(row.id)} onChange={()=>toggleSel(row.id)} style={{cursor:"pointer"}}/></td>
                  <td style={{...td,color:"#00b2d6",fontWeight:700}}>{row.id}</td>
                  <td style={{...td,maxWidth:"160px"}}><div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500 }}>{row.warehouse}</div></td>
                  <td style={{...td,maxWidth:"180px"}}>
                    <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600,color:"#1e293b" }}>{row.item}</div>
                    {row.notes&&<div style={{ fontSize:"0.73rem",color:"#94a3b8",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{row.notes}</div>}
                  </td>
                  <td style={{...td,textAlign:"right",fontWeight:600}}>{Number(row.qty).toLocaleString()} <span style={{color:"#94a3b8",fontWeight:400,fontSize:"0.8rem"}}>{row.unit}</span></td>
                  <td style={{...td,maxWidth:"160px"}}><div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#64748b" }}>{row.destination}</div></td>
                  <td style={{...td,color:"#64748b"}}>{row.shippingDate}</td>
                  <td style={td}><Badge s={row.status}/></td>
                  <td style={{...td,textAlign:"center"}}>
                    <div style={{ display:"flex",gap:"4px",justifyContent:"center" }}>
                      {row.status==="Đang chờ"&&<button title="Chỉnh sửa" onClick={()=>setEditRow(row)} style={{ padding:"5px",border:"none",background:"#f0fdf4",borderRadius:"7px",cursor:"pointer",color:"#16a34a",display:"flex" }}><span className="material-symbols-outlined" style={{fontSize:"17px"}}>edit</span></button>}
                      <button title="Nhân bản" onClick={()=>dup(row)} style={{ padding:"5px",border:"none",background:"#f0f9ff",borderRadius:"7px",cursor:"pointer",color:"#0284c7",display:"flex" }}><span className="material-symbols-outlined" style={{fontSize:"17px"}}>content_copy</span></button>
                      {row.status==="Đang chờ"&&<button title="Hủy" onClick={()=>setConf({type:"cancel",id:row.id})} style={{ padding:"5px",border:"none",background:"#fff7ed",borderRadius:"7px",cursor:"pointer",color:"#ea580c",display:"flex" }}><span className="material-symbols-outlined" style={{fontSize:"17px"}}>cancel</span></button>}
                      {(row.status==="Đã hủy"||row.status==="Từ chối")&&<button title="Xóa" onClick={()=>setConf({type:"delete",id:row.id})} style={{ padding:"5px",border:"none",background:"#fef2f2",borderRadius:"7px",cursor:"pointer",color:"#dc2626",display:"flex" }}><span className="material-symbols-outlined" style={{fontSize:"17px"}}>delete</span></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"11px 14px",borderTop:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"6px" }}>
          <span style={{ fontSize:"0.78rem",color:"#94a3b8" }}>Hiển thị {filtered.length}/{data.length} yêu cầu</span>
          <span style={{ fontSize:"0.78rem",color:"#94a3b8" }}>Tổng: {filtered.reduce((s,r)=>s+Number(r.qty),0).toLocaleString()} đơn vị</span>
        </div>
      </div>

      {editRow&&<EditModal row={editRow} onClose={()=>setEditRow(null)} onSave={save}/>}
      {conf?.type==="cancel"&&<Confirm msg={`Hủy yêu cầu ${conf.id}?`} label="Hủy yêu cầu" danger onOk={()=>doCancel(conf.id)} onCancel={()=>setConf(null)}/>}
      {conf?.type==="delete"&&<Confirm msg={`Xóa vĩnh viễn yêu cầu ${conf.id}?`} label="Xóa" danger onOk={()=>doDelete(conf.id)} onCancel={()=>setConf(null)}/>}
      {conf?.type==="bulk"&&<Confirm msg={`Hủy ${sel.length} yêu cầu đang chờ?`} label="Hủy tất cả" danger onOk={bulkCancel} onCancel={()=>setConf(null)}/>}
    </div>
  );
}
