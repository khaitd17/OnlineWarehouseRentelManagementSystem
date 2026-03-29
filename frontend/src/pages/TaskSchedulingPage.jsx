import { useState, useEffect, useCallback } from "react";
import {
  getTasks,
  getMyWarehouses,
  getTaskTypes,
  getWarehouseZones,
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

const STATUS_STYLES = {
  Pending:   { bg: "#fef9c3", color: "#92400e", label: "Cho xu ly" },
  Done:      { bg: "#dcfce7", color: "#15803d", label: "Hoan thanh" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c", label: "Da huy"    },
};


const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

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

  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:520, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${col.border}22,${col.bg})`, borderBottom:`2px solid ${col.border}`, padding:"20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".6px", color:col.text, background:col.badge, padding:"2px 8px", borderRadius:99, border:`1px solid ${col.border}` }}>
                {task.taskTypeName}
              </span>
              {task.note && task.note !== task.taskTypeName && (
                <h2 style={{ margin:"8px 0 4px", fontSize:16, fontWeight:800, color:"#0f172a" }}>
                  {task.note}
                </h2>
              )}
              {task.scheduledAt && (
                <p style={{ margin:"6px 0 0", fontSize:11, color:"#64748b" }}>
                  {fmtDateTime(task.scheduledAt)}
                </p>
              )}
            </div>
            <button onClick={onClose}
              style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#64748b", flexShrink:0 }}>
              ×
            </button>
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding:"16px 24px", maxHeight:380, overflowY:"auto" }}>
          <p style={{ margin:"0 0 12px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", color:"#94a3b8" }}>Các bước công việc</p>
          {steps.map((u, i) => {
            const isDone      = u.status === "Done";
            const isCurrent   = !isDone && steps.slice(0, i).every(prev => prev.status === "Done");
            const stepLabel   = STEP_STATUS[u.unitTaskTypeCode] || u.description;
            return (
              <div key={u.id} style={{
                display:"flex", gap:12, marginBottom:12,
                padding:"12px 14px", borderRadius:10,
                border:`1.5px solid ${isDone ? "#86efac" : isCurrent ? col.border : "#e2e8f0"}`,
                background: isDone ? "#f0fdf4" : isCurrent ? col.bg : "#f8fafc",
                transition:"all .2s",
              }}>
                {/* Step number / check */}
                <div style={{
                  width:28, height:28, borderRadius:"50%", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize: isDone ? 13 : 11, fontWeight:800,
                  background: isDone ? "#22c55e" : isCurrent ? col.border : "#e2e8f0",
                  color: isDone || isCurrent ? "#fff" : "#94a3b8",
                  boxShadow: isCurrent ? `0 0 0 3px ${col.border}44` : "none",
                }}>
                  {isDone ? "v" : i + 1}
                </div>

                {/* Step content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight: isDone ? 700 : 600, color: isDone ? "#166534" : "#1e293b" }}>
                      {stepLabel}
                    </span>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, flexShrink:0,
                      background: isDone ? "#dcfce7" : isCurrent ? col.badge : "#f1f5f9",
                      color:      isDone ? "#166534" : isCurrent ? col.text   : "#94a3b8",
                      border:`1px solid ${isDone ? "#86efac" : isCurrent ? col.border : "#e2e8f0"}`,
                    }}>
                      {isDone ? "Hoàn thành" : isCurrent ? "Đang xử lý" : "Chưa xử lý"}
                    </span>
                  </div>

                  {/* Performer info */}
                  {isDone && (
                    <div style={{ marginTop:5, fontSize:11, color:"#64748b", display:"flex", flexWrap:"wrap", gap:"4px 12px" }}>
                      {u.completedByName && (
                        <span><strong>{u.completedByName}</strong></span>
                      )}
                      {u.completedAt && (
                        <span>{fmtDateTime(u.completedAt)}</span>
                      )}
                    </div>
                  )}

                  {isCurrent && (
                    <p style={{ margin:"4px 0 0", fontSize:11, color:col.text, fontStyle:"italic" }}>Bước đang chờ xử lý...</p>
                  )}
                </div>
              </div>
            );
          })}
          {steps.length === 0 && (
            <p style={{ textAlign:"center", color:"#94a3b8", fontSize:12, padding:"20px 0" }}>Chưa có bước nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single task card ─────────────────────────────────────────────────────────
function TaskCard({ task, onOpenModal }) {
  const col   = tp(task.taskTypeCode);
  const steps = task.unitTasks ? [...task.unitTasks].sort((a, b) => a.order - b.order) : [];
  const total = steps.length;
  const done  = steps.filter(u => u.status === "Done").length;

  // Last completed step label = "Trạng thái" hiển thị trên card
  const lastDoneStep = [...steps].reverse().find(u => u.status === "Done");
  const statusLabel  = lastDoneStep
    ? (STEP_STATUS[lastDoneStep.unitTaskTypeCode] || lastDoneStep.description)
    : (done === total && total > 0 ? "Hoàn thành" : "Chờ xử lý");
  const statusColor  = lastDoneStep ? col.text : "#92400e";
  const statusBg     = lastDoneStep ? col.badge : "#fef9c3";

  const time = task.scheduledAt
    ? new Date(task.scheduledAt).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })
    : null;

  return (
    <div
      onClick={() => onOpenModal(task)}
      style={{
        background:col.bg, border:`1.5px solid ${col.border}`,
        borderRadius:10, padding:"10px 12px", marginBottom:6,
        cursor:"pointer", transition:"box-shadow .15s, transform .1s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.12)"; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="translateY(0)"; }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:4 }}>
            {task.note || task.taskTypeName}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center", marginBottom: total > 0 ? 6 : 0 }}>
            <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:99, background:col.badge, color:col.text, border:`1px solid ${col.border}` }}>
              {task.taskTypeName}
            </span>
            {time && <span style={{ fontSize:9, color:C.sub }}>{time}</span>}
          </div>
          {/* Status = bước cuối cùng đã hoàn thành */}
          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:statusBg, color:statusColor, border:`1px solid ${col.border}` }}>
            {lastDoneStep ? statusLabel : statusLabel}
          </span>
        </div>

      </div>
    </div>
  );
}

// ─── Create task modal ────────────────────────────────────────────────────────
function CreateTaskModal({ warehouseId, taskTypes, zones, hasZone, defaultDate, onClose, onCreated }) {
  const inp = { width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:"#f8fafc", boxSizing:"border-box", outline:"none" };
  const lbl = { display:"block", fontSize:10, fontWeight:700, color:C.sub, textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 };
  const grp = { marginBottom:12 };
  const [form, setForm] = useState({ taskTypeId:taskTypes[0]?.id??"", isAllZone:!hasZone, zoneIds:[], note:"", scheduledAt:defaultDate, scheduledTime:"08:00" });
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
        isAllZone: form.isAllZone,
        zoneIds: form.isAllZone ? [] : form.zoneIds,
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
            {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
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
        {hasZone && (
          <div style={grp}>
            <label style={lbl}>Khu vuc</label>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, marginBottom:6, color:C.text, cursor:"pointer" }}>
              <input type="checkbox" checked={form.isAllZone} onChange={e => setForm(f=>({...f,isAllZone:e.target.checked,zoneIds:[]}))} style={{ accentColor:C.accent }} />
              Toan bo khu vuc
            </label>
            {!form.isAllZone && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {zones.map(z => {
                  const on = form.zoneIds.includes(z.id);
                  return (
                    <span key={z.id} onClick={() => setForm(f => ({ ...f, zoneIds: on ? f.zoneIds.filter(id=>id!==z.id) : [...f.zoneIds,z.id] }))}
                      style={{ padding:"2px 9px", borderRadius:99, cursor:"pointer", fontSize:11, fontWeight:600, border:`1px solid ${on?C.accent:C.border}`, background:on?C.accentBg:C.surface, color:on?C.accent:C.sub }}>
                      {z.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
  const [zones, setZones]             = useState([]);
  const [tasks, setTasks]             = useState([]);
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

  // Load zones when warehouse changes
  useEffect(() => {
    if (selWh?.warehouseId) getWarehouseZones(selWh.warehouseId).then(setZones).catch(() => setZones([]));
  }, [selWh]);

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

  // Group tasks by date
  const tasksByDate = {};
  weekDays.forEach(d => { tasksByDate[isoDate(d)] = []; });
  tasks.forEach(t => {
    if (!t.scheduledAt) return;
    const k = isoDate(new Date(t.scheduledAt));
    if (tasksByDate[k]) tasksByDate[k].push(t);
  });

  const whId = selWh?.warehouseId;
  const hasZone = selWh?.hasZone ?? false;
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

      {/* ── Week grid ── */}
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
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", minHeight:200 }}>
              {weekDays.map((d, i) => {
                const iso = isoDate(d);
                const dayTasks = tasksByDate[iso] || [];
                const isToday = iso === todayISO;
                return (
                  <div key={i} style={{
                    padding:"10px 8px",
                    borderRight: i < 6 ? `1px solid ${C.border}` : "none",
                    background: isToday ? "#fafbff" : "transparent",
                    verticalAlign:"top",
                    minHeight: 180,
                  }}>
                    {dayTasks.length === 0 ? (
                      <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", minHeight:60 }}>
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
          Tong: {tasks.length} task trong tuan nay
        </div>
      </div>

      {/* ── Task detail modal — hiển thị bước quy trình ── */}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}

      {/* ── Create modal ── */}
      {showCreate && whId && (
        <CreateTaskModal
          warehouseId={whId}
          taskTypes={taskTypes}
          zones={zones}
          hasZone={hasZone}
          defaultDate={isoDate(weekStart)}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadTasks(); }}
        />
      )}
    </div>
  );
}
