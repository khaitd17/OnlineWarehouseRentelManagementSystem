import { useState, useEffect, useCallback } from "react";
import {
  getTasks,
  getMyWarehouses,
  getTaskTypes,
  createTask,
} from "../services/taskSchedulingService";

// ─── Palette (light) ──────────────────────────────────────────────────────────
const C = {
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  accent: "#6366f1",
  accentBg: "#eff0ff",
  text: "#0f172a",
  sub: "#64748b",
  subLight: "#94a3b8",
  shadow: "0 1px 3px rgba(0,0,0,.08)",
  shadowMd: "0 4px 16px rgba(0,0,0,.12)",
  overlay: "rgba(15,23,42,.45)",
};

const TYPE_PALETTE = {
  INBOUND:       { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", badge: "#dcfce7" },
  OUTBOUND:      { bg: "#fffbeb", border: "#f59e0b", text: "#b45309", badge: "#fef3c7" },
  AUDIT:         { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8", badge: "#dbeafe" },
  EQUIP_MAINT:   { bg: "#faf5ff", border: "#a855f7", text: "#7e22ce", badge: "#f3e8ff" },
  GENERAL_CLEAN: { bg: "#ecfeff", border: "#0891b2", text: "#0e7490", badge: "#cffafe" },
  ZONE_INSPECT:  { bg: "#f8fafc", border: "#64748b", text: "#475569", badge: "#f1f5f9" },
  OTHER:         { bg: "#f8fafc", border: "#94a3b8", text: "#64748b", badge: "#f1f5f9" },
};
const tp = code => TYPE_PALETTE[code] || TYPE_PALETTE.OTHER;

// Task status color system — based on completion state
const TASK_STATUS = {
  done:      { card: "#f0fdf4", cardBorder: "#22c55e", badge: "#dcfce7", badgeText: "#15803d", badgeBorder: "#86efac", label: "Hoan thanh" },
  inprogress:{ card: "#eff6ff", cardBorder: "#3b82f6", badge: "#dbeafe", badgeText: "#1d4ed8", badgeBorder: "#93c5fd", label: "Dang xu ly" },
  pending:   { card: "#fafafa", cardBorder: "#e2e8f0", badge: "#f1f5f9", badgeText: "#64748b", badgeBorder: "#cbd5e1", label: "Chua bat dau" },
};
const getTaskStatus = (steps, taskStatus) => {
  if (!steps || steps.length === 0) {
    if (taskStatus === "Done") return "done";
    return "pending";
  }
  const done = steps.filter(s => s.status === "Done").length;
  if (done === steps.length) return "done";
  if (done > 0) return "inprogress";
  return "pending";
};


const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseNote(note) {
  if (!note) return { renter: null, items: null, raw: null };
  const m = note.match(/^\[(.+?)\]\s*(.*)$/);
  if (m) return { renter: m[1].trim(), items: m[2].trim() || null, raw: note };
  return { renter: null, items: null, raw: note };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getMon(ref) {
  const d = new Date(ref);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtDateVN(d) {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}
function fmtDateFull(d) {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:C.overlay, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, borderRadius:14, padding:"24px 28px", border:`1px solid ${C.border}`, boxShadow:C.shadowMd, minWidth:340, maxWidth:480, width:"100%" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Helper: label chủ động cho step status ─────────────────────────────────
const STEP_STATUS = {
  INBOUND_APPROVE:  "Duyệt đơn nhập kho",
  INBOUND_RECEIVE:  "Tiếp nhận hàng",
  INBOUND_PUTAWAY:  "Đặt vào vị trí",
  OUTBOUND_APPROVE: "Duyệt đơn xuất kho",
  OUTBOUND_PICK:    "Lấy hàng",
  OUTBOUND_DISPATCH:"Xuất kho",
  AUDIT_OPEN:       "Mở phiên kiểm kê",
  AUDIT_COUNT:      "Kiểm đếm hàng",
  AUDIT_CLOSE:      "Đóng phiên kiểm kê",
};

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskDetailModal({ task, onClose }) {
  if (!task) return null;
  const col     = tp(task.taskTypeCode);
  const steps   = task.unitTasks ? [...task.unitTasks].sort((a, b) => a.order - b.order) : [];
  const total   = steps.length;
  const done    = steps.filter(u => u.status === "Done").length;
  const tStatus = getTaskStatus(steps, task.status);
  const tStyle  = TASK_STATUS[tStatus];
  const { renter, items, raw } = parseNote(task.note);

  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  // Header color: status overrides type palette
  const headerBg     = tStatus === "done" ? "linear-gradient(135deg,#bbf7d0,#f0fdf4)" : `linear-gradient(135deg,${col.border}22,${col.bg})`;
  const headerBorder = tStatus === "done" ? "#22c55e" : col.border;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:520, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:headerBg, borderBottom:`2px solid ${headerBorder}`, padding:"20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1, minWidth:0 }}>
              {/* Type badge + status badge */}
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".6px", color:col.text, background:col.badge, padding:"2px 8px", borderRadius:99, border:`1px solid ${col.border}` }}>
                  {task.taskTypeName}
                </span>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 10px", borderRadius:99, background:tStyle.badge, color:tStyle.badgeText, border:`1px solid ${tStyle.badgeBorder}` }}>
                  {total > 0 ? `${done}/${total} buoc` : tStyle.label}
                </span>
              </div>
              {renter && (
                <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:11, color:"#64748b" }}>Nguoi thue:</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{renter}</span>
                </div>
              )}
              {items && (
                <div style={{ marginTop:4, fontSize:11, color:"#475569", lineHeight:1.5 }}>
                  <span style={{ color:"#94a3b8" }}>Hang hoa: </span>{items}
                </div>
              )}
              {!renter && raw && (
                <h2 style={{ margin:"8px 0 4px", fontSize:16, fontWeight:800, color:"#0f172a" }}>{raw}</h2>
              )}
              {task.scheduledAt && (
                <p style={{ margin:"6px 0 0", fontSize:11, color:"#64748b" }}>{fmtDateTime(task.scheduledAt)}</p>
              )}
            </div>
            <button onClick={onClose}
              style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#64748b", flexShrink:0 }}>
              ×
            </button>
          </div>
        </div>

        {/* Progress bar (nếu có steps) */}
        {total > 0 && (
          <div style={{ padding:"10px 24px 0", background:"#fafafa", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.sub, marginBottom:4 }}>
              <span>Tien do</span>
              <span style={{ fontWeight:700, color: tStatus === "done" ? "#15803d" : tStatus === "inprogress" ? "#1d4ed8" : C.sub }}>{Math.round(done/total*100)}%</span>
            </div>
            <div style={{ height:5, borderRadius:99, background:"#e2e8f0", marginBottom:10, overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:99, width:`${Math.round(done/total*100)}%`,
                background: tStatus === "done" ? "#22c55e" : tStatus === "inprogress" ? "#3b82f6" : "#e2e8f0",
                transition:"width .3s" }} />
            </div>
          </div>
        )}

        {/* Steps */}
        <div style={{ padding:"16px 24px", maxHeight:360, overflowY:"auto" }}>
          <p style={{ margin:"0 0 12px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", color:"#94a3b8" }}>Cac buoc cong viec</p>
          {steps.map((u, i) => {
            const isDone    = u.status === "Done";
            const isCur     = !isDone && steps.slice(0, i).every(prev => prev.status === "Done");
            const stepLabel = STEP_STATUS[u.unitTaskTypeCode] || u.description;
            const stepBg    = isDone ? "#f0fdf4" : isCur ? "#eff6ff" : "#f8fafc";
            const stepBorder= isDone ? "#86efac" : isCur ? "#93c5fd" : "#e2e8f0";
            const circBg    = isDone ? "#22c55e" : isCur ? "#3b82f6" : "#e2e8f0";
            const circClr   = isDone || isCur ? "#fff" : "#94a3b8";
            const badgeBg   = isDone ? "#dcfce7" : isCur ? "#dbeafe" : "#f1f5f9";
            const badgeTxt  = isDone ? "#166534" : isCur ? "#1d4ed8" : "#94a3b8";
            const badgeBdr  = isDone ? "#86efac" : isCur ? "#93c5fd" : "#e2e8f0";
            return (
              <div key={u.id} style={{ display:"flex", gap:12, marginBottom:10, padding:"10px 12px", borderRadius:10, border:`1.5px solid ${stepBorder}`, background:stepBg, transition:"all .2s" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize: isDone ? 13 : 11, fontWeight:800, background:circBg, color:circClr, boxShadow: isCur ? "0 0 0 3px #93c5fd55" : "none" }}>
                  {isDone ? "✓" : i + 1}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight: isDone ? 700 : 600, color: isDone ? "#166534" : "#1e293b" }}>{stepLabel}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, flexShrink:0, background:badgeBg, color:badgeTxt, border:`1px solid ${badgeBdr}` }}>
                      {isDone ? "Hoan thanh" : isCur ? "Dang xu ly" : "Chua xu ly"}
                    </span>
                  </div>
                  {isDone && (
                    <div style={{ marginTop:4, fontSize:11, color:"#64748b", display:"flex", flexWrap:"wrap", gap:"3px 10px" }}>
                      {u.completedByName && <span><strong>{u.completedByName}</strong></span>}
                      {u.completedAt && <span>{fmtDateTime(u.completedAt)}</span>}
                    </div>
                  )}
                  {isCur && <p style={{ margin:"3px 0 0", fontSize:11, color:"#3b82f6", fontStyle:"italic" }}>Dang cho xu ly...</p>}
                </div>
              </div>
            );
          })}
          {steps.length === 0 && (
            <p style={{ textAlign:"center", color:"#94a3b8", fontSize:12, padding:"20px 0" }}>Chua co buoc nao.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single task card ─────────────────────────────────────────────────────────
function TaskCard({ task, onOpenModal }) {
  const col     = tp(task.taskTypeCode);
  const steps   = task.unitTasks ? [...task.unitTasks].sort((a, b) => a.order - b.order) : [];
  const total   = steps.length;
  const done    = steps.filter(u => u.status === "Done").length;
  const tStatus = getTaskStatus(steps, task.status);
  const tStyle  = TASK_STATUS[tStatus];

  const time = task.scheduledAt
    ? new Date(task.scheduledAt).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })
    : null;

  const { renter, items, raw } = parseNote(task.note);

  return (
    <div
      onClick={() => onOpenModal(task)}
      style={{
        background: tStyle.card,
        border: `1.5px solid ${tStyle.cardBorder}`,
        borderRadius:10, padding:"10px 12px", marginBottom:6,
        cursor:"pointer", transition:"box-shadow .15s, transform .1s",
        overflow:"hidden", minWidth:0,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.12)"; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="translateY(0)"; }}
    >
      {/* Type badge + time */}
      <div style={{ display:"flex", gap:5, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
        <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:99, background:col.badge, color:col.text, border:`1px solid ${col.border}` }}>
          {task.taskTypeName}
        </span>
        {time && <span style={{ fontSize:9, color:C.sub }}>{time}</span>}
      </div>

      {/* Note/title */}
      {renter && <div style={{ fontSize:11, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{renter}</div>}
      <div style={{ fontSize:11, color:C.sub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:6 }}>
        {items || raw || task.taskTypeName}
      </div>

      {/* Status badge */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:tStyle.badge, color:tStyle.badgeText, border:`1px solid ${tStyle.badgeBorder}` }}>
          {tStyle.label}
        </span>
        {/* Mini progress dots */}
        {total > 0 && (
          <div style={{ display:"flex", gap:3 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ width:6, height:6, borderRadius:"50%",
                background: s.status === "Done" ? "#22c55e" : i === done ? "#3b82f6" : "#e2e8f0" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create task modal ────────────────────────────────────────────────────────
// Chỉ cho phép tạo thủ công các loại task nội bộ — INBOUND/OUTBOUND/AUDIT tự động từ workflow
const MANUAL_TASK_CODES = ["EQUIP_MAINT", "GENERAL_CLEAN", "ZONE_INSPECT", "OTHER"];

function CreateTaskModal({ warehouseId, taskTypes, defaultDate, onClose, onCreated }) {
  const manualTypes = taskTypes.filter(tt => MANUAL_TASK_CODES.includes(tt.code?.toUpperCase?.() || tt.code));
  const inp = { width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:"#f8fafc", boxSizing:"border-box", outline:"none" };
  const lbl = { display:"block", fontSize:10, fontWeight:700, color:C.sub, textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 };
  const grp = { marginBottom:12 };
  const [form, setForm] = useState({ taskTypeId:manualTypes[0]?.id??"", note:"", scheduledAt:defaultDate, scheduledTime:"08:00" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.taskTypeId) return setErr("Vui long chon loai task.");
    if (!form.scheduledAt) return setErr("Vui long chon ngay.");
    setSaving(true);
    try {
      await createTask(warehouseId, {
        taskTypeId: Number(form.taskTypeId),
        note: form.note || null,
        scheduledAt: new Date(`${form.scheduledAt}T${form.scheduledTime}:00`).toISOString(),
      });
      onCreated();
    } catch(ex) { setErr(ex.response?.data?.message || ex.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ fontWeight:800, fontSize:15, color:C.text, marginBottom:16 }}>Tao Task Moi</div>
      {err && <div style={{ padding:"8px 12px", background:"#fff1f2", color:"#dc2626", borderRadius:6, fontSize:11, marginBottom:10, border:"1px solid #fecaca" }}>{err}</div>}
      <form onSubmit={handleSubmit}>
        <div style={grp}>
          <label style={lbl}>Loai task *</label>
          <select value={form.taskTypeId} onChange={e => setForm(f=>({...f,taskTypeId:e.target.value}))} style={inp}>
            {manualTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:12 }}>
          <div style={{ flex:1 }}>
            <label style={lbl}>Ngay *</label>
            <input type="date" value={form.scheduledAt} onChange={e => setForm(f=>({...f,scheduledAt:e.target.value}))} style={inp} required />
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>Gio</label>
            <input type="time" value={form.scheduledTime} onChange={e => setForm(f=>({...f,scheduledTime:e.target.value}))} style={inp} />
          </div>
        </div>
        <div style={grp}>
          <label style={lbl}>Ghi chu</label>
          <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={3}
            style={{ ...inp, resize:"vertical", fontFamily:"inherit" }} placeholder="Mo ta cong viec..." />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button type="button" onClick={onClose}
            style={{ flex:1, padding:"8px 0", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.sub, cursor:"pointer", fontSize:12, fontWeight:600 }}>
            Huy
          </button>
          <button type="submit" disabled={saving}
            style={{ flex:1, padding:"8px 0", borderRadius:7, border:"none", background:C.accent, color:"#fff", cursor:saving?"not-allowed":"pointer", fontSize:12, fontWeight:700, opacity:saving?.7:1 }}>
            {saving ? "Dang tao..." : "Tao task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TaskSchedulingPage() {
  const [warehouses, setWarehouses]   = useState([]);
  const [selWh, setSelWh]             = useState(null);
  const [taskTypes, setTaskTypes]     = useState([]);
  const [tasks, setTasks]             = useState([]);
  const [filterType, setFilterType]   = useState(null); // null = tat ca
  const [loading, setLoading]         = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [weekStart, setWeekStart]     = useState(() => getMon(new Date()));

  const weekDays = Array.from({ length:7 }, (_, i) => addDays(weekStart, i));
  const startISO = `${isoDate(weekStart)}T00:00:00Z`;
  const endISO   = `${isoDate(weekDays[6])}T23:59:59Z`;
  const todayISO = isoDate(new Date());

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday  = () => setWeekStart(getMon(new Date()));

  // Load warehouses
  useEffect(() => {
    getMyWarehouses().then(wh => {
      setWarehouses(wh);
      if (wh.length > 0) setSelWh(wh[0]);
    }).catch(() => {});
    getTaskTypes().then(setTaskTypes).catch(() => {});
  }, []);

  // Load tasks when warehouse or week changes
  const loadTasks = useCallback(async () => {
    if (!selWh?.warehouseId) return;
    setLoading(true);
    try {
      const data = await getTasks(selWh.warehouseId, startISO, endISO);
      setTasks(Array.isArray(data) ? data : (data?.tasks || []));
    } catch { setTasks([]); }
    setLoading(false);
  }, [selWh, startISO, endISO]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Group tasks by date (backend da filter isManual=true)
  const filteredTasks = filterType
    ? tasks.filter(t => (t.taskTypeCode || "").toUpperCase() === filterType)
    : tasks; // khong filter FE, backend da bao dam

  const tasksByDate = {};
  weekDays.forEach(d => { tasksByDate[isoDate(d)] = []; });
  filteredTasks.forEach(t => {
    if (!t.scheduledAt) return;
    const k = isoDate(new Date(t.scheduledAt));
    if (tasksByDate[k]) tasksByDate[k].push(t);
  });

  const whId = selWh?.warehouseId;
  const weekLabel = `${fmtDateFull(weekStart)} - ${fmtDateFull(weekDays[6])}`;

  const btnBase = {
    padding:"6px 14px", borderRadius:7, border:`1px solid ${C.border}`,
    background:C.surface, color:C.text, cursor:"pointer", fontSize:12, fontWeight:600,
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter','Segoe UI',sans-serif", color:C.text }}>

      {/* ── Toolbar ── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          {/* Title + warehouse */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div>
              <h1 style={{ margin:0, fontSize:17, fontWeight:800, color:C.text }}>Quan ly Task</h1>
              <p style={{ margin:0, fontSize:11, color:C.sub }}>Lich cong viec theo tuan</p>
            </div>
            {warehouses.length > 1 && (
              <select value={whId ?? ""} onChange={e => setSelWh(warehouses.find(w => w.warehouseId === Number(e.target.value)))}
                style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:C.surface, cursor:"pointer" }}>
                {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName || w.name}</option>)}
              </select>
            )}
            {warehouses.length === 1 && (
              <span style={{ fontSize:12, color:C.sub, fontWeight:600 }}>{selWh?.warehouseName || selWh?.name}</span>
            )}
          </div>

          {/* Week nav + create */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={prevWeek} style={btnBase}>&#8592; Tuan truoc</button>
            <div style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${C.border}`, background:C.accentBg, fontSize:12, fontWeight:700, color:C.accent, minWidth:200, textAlign:"center" }}>
              {weekLabel}
            </div>
            <button onClick={nextWeek} style={btnBase}>Tuan sau &#8594;</button>
            <button onClick={goToday} style={{ ...btnBase, border:`1px solid ${C.accent}`, color:C.accent }}>Hom nay</button>
            <button onClick={loadTasks} style={btnBase}>Lam moi</button>
            <button onClick={() => setShowCreate(true)}
              style={{ padding:"6px 16px", borderRadius:7, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700 }}>
              + Tao Task
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"8px 24px", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, fontWeight:700, color:C.sub, textTransform:"uppercase", letterSpacing:".5px", marginRight:4 }}>Loai task:</span>
        {/* Tat ca manual */}
        <button
          onClick={() => setFilterType(null)}
          style={{
            padding:"3px 12px", borderRadius:99, fontSize:11, fontWeight:700, cursor:"pointer",
            border:`1.5px solid ${!filterType ? C.accent : C.border}`,
            background: !filterType ? C.accentBg : "transparent",
            color: !filterType ? C.accent : C.sub,
            transition:"all .15s",
          }}
        >Tat ca manual</button>
        {/* Tung loai manual */}
        {taskTypes
          .filter(tt => tt.isManual)
          .map(tt => {
            const code = (tt.code || tt.Code || "").toUpperCase();
            const pal  = tp(code);
            const active = filterType === code;
            return (
              <button key={tt.id}
                onClick={() => setFilterType(active ? null : code)}
                style={{
                  padding:"3px 12px", borderRadius:99, fontSize:11, fontWeight:700, cursor:"pointer",
                  border:`1.5px solid ${active ? pal.border : C.border}`,
                  background: active ? pal.badge : "transparent",
                  color: active ? pal.text : C.sub,
                  transition:"all .15s",
                }}
              >{tt.name}</button>
            );
          })
        }
        <span style={{ marginLeft:"auto", fontSize:10, color:C.subLight }}>
          {filteredTasks.length} task hien thi
        </span>
      </div>

      <div style={{ padding:"20px 24px" }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", boxShadow:C.shadow }}>

          {/* Header row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`2px solid ${C.border}` }}>
            {weekDays.map((d, i) => {
              const iso = isoDate(d);
              const isToday = iso === todayISO;
              return (
                <div key={i} style={{
                  padding:"10px 12px", textAlign:"center",
                  background: isToday ? C.accentBg : C.surface,
                  borderRight: i < 6 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color: isToday ? C.accent : C.sub }}>
                    {WEEKDAYS[i]}
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color: isToday ? C.accent : C.text, marginTop:1 }}>
                    {fmtDateVN(d)}
                  </div>
                  {isToday && (
                    <div style={{ width:6, height:6, borderRadius:"50%", background:C.accent, margin:"4px auto 0" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Task cells */}
          {loading ? (
            <div style={{ padding:"40px", textAlign:"center", color:C.subLight, fontSize:13 }}>
              Dang tai task...
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", alignItems:"start", minHeight:200 }}>
              {weekDays.map((d, i) => {
                const iso = isoDate(d);
                const dayTasks = tasksByDate[iso] || [];
                const isToday = iso === todayISO;
                return (
                  <div key={i} style={{
                    padding:"10px 8px",
                    borderRight: i < 6 ? `1px solid ${C.border}` : "none",
                    background: isToday ? "#fafbff" : "transparent",
                    minHeight: 180,
                    minWidth: 0,
                    overflow: "hidden",
                  }}>
                    {dayTasks.length === 0 ? (
                      <div style={{ paddingTop:8, textAlign:"center" }}>
                        <span style={{ fontSize:10, color:C.subLight }}>—</span>
                      </div>
                    ) : dayTasks.map(t => (
                      <TaskCard key={t.id} task={t} onOpenModal={setSelectedTask} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task count summary */}
        <div style={{ marginTop:12, fontSize:11, color:C.sub, textAlign:"right" }}>
          Tong: {filteredTasks.length}/{tasks.length} task trong tuan nay
        </div>
      </div>

      {/* ── Task detail modal — hiển thị bước quy trình ── */}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}

      {/* ── Create modal ── */}
      {showCreate && whId && (
        <CreateTaskModal
          warehouseId={whId}
          taskTypes={taskTypes}
          defaultDate={isoDate(weekStart)}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadTasks(); }}
        />
      )}
    </div>
  );
}
