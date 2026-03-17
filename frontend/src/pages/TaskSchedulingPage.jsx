import { useState, useEffect, useCallback } from "react";
import {
  getWeekTasks,
  getEligibleStaff,
  scheduleTask,
  unscheduleTask,
  assignStaff,
  getMyWarehouses,
  getTaskTypes,
  getWarehouseZones,
  createTask,
} from "../services/taskSchedulingService";

function normalize(t) {
  const at = t.scheduledAt ? new Date(t.scheduledAt) : null;
  return {
    ...t,
    title: t.note || t.taskTypeName,
    scheduledDate: at ? at.toISOString().split("T")[0] : null,
    startTime: at ? at.toTimeString().slice(0, 5) : null,
    assignedStaff: (t.assignments || []).map(a => ({
      membershipId: a.membershipId,
      fullName: a.userFullName,
      roleCode: "STAFF",
      roleName: a.userFullName,
    })),
  };
}

const C = {
  bg: "#f1f5f9",
  surface: "#ffffff",
  card: "#f8fafc",
  cardHover: "#f0f4ff",
  border: "#e2e8f0",
  accent: "#6366f1",
  accentL: "#4f46e5",
  text: "#0f172a",
  sub: "#64748b",
  subLight: "#94a3b8",
  overlay: "rgba(15,23,42,.4)",
  shadow: "0 1px 4px rgba(0,0,0,.08)",
  shadowMd: "0 4px 12px rgba(0,0,0,.1)",
};

const TYPE_COLORS = {
  INBOUND: { bg: "#f0fdf4", border: "#86efac", text: "#16a34a", pill: "#dcfce7" },
  OUTBOUND: { bg: "#fffbeb", border: "#fcd34d", text: "#d97706", pill: "#fef3c7" },
  AUDIT: { bg: "#eff6ff", border: "#93c5fd", text: "#2563eb", pill: "#dbeafe" },
  TRANSPORT: { bg: "#faf5ff", border: "#d8b4fe", text: "#9333ea", pill: "#f3e8ff" },
  MAINTENANCE: { bg: "#fff1f2", border: "#fca5a5", text: "#dc2626", pill: "#fee2e2" },
};
const tc = (code) => TYPE_COLORS[code] || { bg: "#f8fafc", border: "#cbd5e1", text: "#475569", pill: "#f1f5f9" };

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getWeekStart(ref) {
  const d = new Date(ref);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isoDate(d) { return d.toISOString().split("T")[0]; }
function fmtDate(d) { return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`; }
function fmtWeekRange(s) { const e = addDays(s, 6); return `${fmtDate(s)} – ${fmtDate(e)}/${e.getFullYear()}`; }
function groupByType(tasks) {
  return tasks.reduce((a, t) => {
    if (!a[t.taskTypeName]) a[t.taskTypeName] = { code: t.taskTypeCode, tasks: [] };
    a[t.taskTypeName].tasks.push(t); return a;
  }, {});
}
function uniqueTypes(tasks) {
  const seen = new Set();
  return tasks.filter(t => { if (seen.has(t.taskTypeCode)) return false; seen.add(t.taskTypeCode); return true; })
    .map(t => ({ code: t.taskTypeCode, name: t.taskTypeName }));
}

function Modal({ onClose, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, borderRadius: 14, padding: "22px 26px", border: `1px solid ${C.border}`, boxShadow: C.shadowMd, minWidth: 320 }}>
        {children}
      </div>
    </div>
  );
}

function SetTimeModal({ taskTitle, targetDate, onClose, onConfirm }) {
  const [time, setTime] = useState("08:00");
  return (
    <Modal onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>📅 Xác nhận lịch</div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 16 }}>{taskTitle}</div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>
        Ngày: <strong style={{ color: C.text }}>{targetDate}</strong>
      </div>
      <label style={{ display: "block", fontSize: 11, color: C.sub, marginBottom: 5 }}>Giờ bắt đầu</label>
      <input type="time" value={time} onChange={e => setTime(e.target.value)}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.card, color: C.text, fontSize: 13, boxSizing: "border-box"
        }} />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={btnStyle("ghost")}>Hủy</button>
        <button onClick={() => onConfirm(time)} style={btnStyle("primary")}>✓ Lên lịch</button>
      </div>
    </Modal>
  );
}

function AssignModal({ task, allStaff, loading, onClose, onSave }) {
  const [sel, setSel] = useState(new Set(task.assignedStaff.map(s => s.membershipId)));
  const toggle = id => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <Modal onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>
        {task.assignedStaff.length > 0 ? "🔄 Reassign nhân viên" : "👤 Gán nhân viên"}
      </div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>{task.title}</div>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.sub, fontSize: 11 }}>
            Đang tải danh sách nhân viên...
          </div>
        ) : allStaff.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.subLight, fontSize: 11 }}>
            Không có nhân viên phù hợp với task này.
          </div>
        ) : allStaff.map(s => (
          <label key={s.membershipId} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer"
          }}>
            <input type="checkbox" checked={sel.has(s.membershipId)} onChange={() => toggle(s.membershipId)}
              style={{ width: 14, height: 14, accentColor: C.accent }} />
            <div>
              <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{s.fullName}</div>
              <div style={{ fontSize: 10, color: C.sub }}>{s.roleName}</div>
            </div>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={btnStyle("ghost")}>Hủy</button>
        <button onClick={() => onSave([...sel])} style={btnStyle("primary")} disabled={loading}>✓ Xác nhận</button>
      </div>
    </Modal>
  );
}

function btnStyle(variant) {
  const base = { flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .15s" };
  if (variant === "primary") return { ...base, border: "none", background: C.accent, color: "#fff" };
  if (variant === "ghost") return { ...base, border: `1px solid ${C.border}`, background: "transparent", color: C.sub };
  if (variant === "danger") return { ...base, border: "none", background: "#ef4444", color: "#fff" };
  if (variant === "assign") return { padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.accent}`, background: "#eff0ff", color: C.accentL, cursor: "pointer", fontSize: 9, fontWeight: 700 };
  if (variant === "reassign") return { padding: "2px 8px", borderRadius: 4, border: `1px solid #f59e0b`, background: "#fffbeb", color: "#d97706", cursor: "pointer", fontSize: 9, fontWeight: 700 };
  return base;
}

function CreateTaskModal({ warehouseId, taskTypes, zones, hasZone, onClose, onCreated }) {
  const [form, setForm] = useState({
    taskTypeId: taskTypes[0]?.id ?? "",
    isAllZone: !hasZone,
    zoneIds: [],
    note: "",
    scheduledAt: "",
    scheduledTime: "08:00",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const toggleZone = id => setForm(f => ({ ...f, zoneIds: f.zoneIds.includes(id) ? f.zoneIds.filter(z => z !== id) : [...f.zoneIds, id] }));

  const handleSubmit = async e => {
    e.preventDefault();
    setErr("");
    if (!form.taskTypeId) return setErr("Vui lòng chọn loại task.");
    setSaving(true);
    try {
      const scheduledAt = form.scheduledAt
        ? new Date(`${form.scheduledAt}T${form.scheduledTime}:00`).toISOString()
        : null;
      await createTask(warehouseId, {
        taskTypeId: Number(form.taskTypeId),
        isAllZone: form.isAllZone,
        zoneIds: form.isAllZone ? [] : form.zoneIds,
        note: form.note || null,
        scheduledAt,
      });
      onCreated();
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = { width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, background: C.card, boxSizing: "border-box", outline:"none" };
  const lbl = { display: "block", fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 };
  const grp = { marginBottom: 14 };

  return (
    <Modal onClose={onClose}>
      <div style={{ width: 420 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 16 }}>➕ Tạo Task Mới</div>
        {err && <div style={{ padding: "8px 12px", background: "#fff1f2", color: "#dc2626", borderRadius: 6, fontSize: 11, marginBottom: 12, border: "1px solid #fecaca" }}>{err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={grp}>
            <label style={lbl}>Loại task *</label>
            <select value={form.taskTypeId} onChange={e => setForm(f => ({ ...f, taskTypeId: e.target.value }))} style={inp}>
              {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name} ({tt.code})</option>)}
            </select>
          </div>

          {hasZone ? (
            <div style={grp}>
              <label style={lbl}>Khu vực</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={form.isAllZone} onChange={e => setForm(f => ({ ...f, isAllZone: e.target.checked, zoneIds: [] }))} style={{ accentColor: C.accent }} />
                Áp dụng toàn bộ khu vực
              </label>
              {!form.isAllZone && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {zones.length === 0
                    ? <span style={{ fontSize: 11, color: C.subLight }}>Không có zone nào</span>
                    : zones.map(z => {
                      const on = form.zoneIds.includes(z.id);
                      return (
                        <span key={z.id} onClick={() => toggleZone(z.id)} style={{
                          padding: "3px 10px", borderRadius: 14, border: `1.5px solid ${on ? C.accent : C.border}`,
                          background: on ? "#eff0ff" : C.surface, color: on ? C.accentL : C.sub,
                          fontSize: 11, fontWeight: 600, cursor: "pointer", userSelect: "none"
                        }}>
                          {z.name} ({z.code})
                        </span>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...grp, padding: "8px 12px", background: "#f8fafc", borderRadius: 7, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 11, color: C.sub }}>📦 Kho không cài đặt zone — task sẽ áp dụng toàn bộ kho</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Ngày thực hiện</label>
              <input type="date" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Giờ bắt đầu</label>
              <input type="time" value={form.scheduledTime} onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))} style={inp} />
            </div>
          </div>

          <div style={grp}>
            <label style={lbl}>Ghi chú</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Mô tả chi tiết công việc..."
              rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} style={btnStyle("ghost")}>Hủy</button>
            <button type="submit" disabled={saving} style={{ ...btnStyle("primary"), opacity: saving ? .7 : 1 }}>
              {saving ? "Đang tạo..." : "✓ Tạo task"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function TaskCell({ task, onAssign, onDragStart }) {
  const col = tc(task.taskTypeCode);
  const hasStaff = task.assignedStaff.length > 0;
  return (
    <div draggable
      onDragStart={e => { e.dataTransfer.setData("taskId", String(task.id)); onDragStart?.(); }}
      style={{
        background: col.bg, border: `1px solid ${col.border}`, borderRadius: 6,
        padding: "5px 7px", marginBottom: 3, cursor: "grab", fontSize: 10
      }}>
      <div style={{ fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{task.title}</div>
      {task.startTime && <div style={{ color: col.text, fontWeight: 600, marginBottom: 2 }}>🕐 {task.startTime}</div>}
      {hasStaff && (
        <div style={{ marginBottom: 4 }}>
          {task.assignedStaff.map(s => (
            <span key={s.membershipId} style={{
              display: "inline-block", background: "#fff",
              border: `1px solid ${C.border}`, borderRadius: 3, padding: "1px 5px",
              marginRight: 2, marginBottom: 2, color: C.text, fontSize: 9
            }}>
              {s.fullName}
            </span>
          ))}
        </div>
      )}
      <button onClick={e => { e.stopPropagation(); onAssign(task); }}
        style={hasStaff ? btnStyle("reassign") : btnStyle("assign")}>
        {hasStaff ? "Reassign" : "Assign"}
      </button>
    </div>
  );
}

function TimetableGrid({ weekDays, scheduledTasks, allStaff, onAssign, onDropToCell }) {
  const taskTypes = uniqueTypes(scheduledTasks);
  const [dragOver, setDragOver] = useState(null);

  const cellMap = {};
  scheduledTasks.forEach(t => {
    const k = `${t.taskTypeCode}-${t.scheduledDate}`;
    if (!cellMap[k]) cellMap[k] = [];
    cellMap[k].push(t);
  });

  const thBase = {
    padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.sub,
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    borderRight: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 2,
    textAlign: "center",
  };

  return (
    <div style={{
      overflowX: "auto", overflowY: "auto", flex: 1,
      border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface, boxShadow: C.shadow
    }}>
      <table style={{ borderCollapse: "collapse", minWidth: "100%", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ ...thBase, minWidth: 100, width: 100, textAlign: "left" }}>Loại task</th>
            {weekDays.map((d, i) => {
              const isToday = isoDate(d.date) === isoDate(new Date());
              return (
                <th key={i} style={{
                  ...thBase, minWidth: 90,
                  color: isToday ? C.accentL : C.sub,
                  borderBottom: isToday ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                }}>
                  <div style={{ fontWeight: 700 }}>{d.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 400 }}>{fmtDate(d.date)}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {taskTypes.length === 0 ? (
            <tr><td colSpan={weekDays.length + 1} style={{ textAlign: "center", padding: 48, color: C.subLight, fontSize: 11 }}>
              Kéo task từ bên phải vào đây để lên lịch
            </td></tr>
          ) : taskTypes.map(row => {
            const col = tc(row.code);
            return (
              <tr key={row.code} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{
                  padding: "6px 8px", fontSize: 10, fontWeight: 700, color: col.text,
                  background: col.bg, borderRight: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${col.border}`, whiteSpace: "nowrap"
                }}>
                  {row.name}
                </td>
                {weekDays.map((d, ci) => {
                  const dateStr = isoDate(d.date);
                  const key = `${row.code}-${dateStr}`;
                  const cells = cellMap[key] || [];
                  const isOver = dragOver === key;
                  return (
                    <td key={ci}
                      onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => {
                        e.preventDefault(); setDragOver(null);
                        onDropToCell(parseInt(e.dataTransfer.getData("taskId"), 10), dateStr);
                      }}
                      style={{
                        padding: "4px 5px", verticalAlign: "top",
                        borderRight: `1px solid ${C.border}`, minHeight: 48,
                        background: isOver ? "#eff0ff" : "transparent",
                        outline: isOver ? `2px dashed ${C.accent}` : "none",
                        transition: "background .12s"
                      }}>
                      {cells.map(t => (
                        <TaskCell key={t.id} task={t} onAssign={onAssign} />
                      ))}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <td colSpan={weekDays.length + 1}
              onDragOver={e => { e.preventDefault(); setDragOver("__extra__"); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); }}
              style={{ height: 36, borderTop: `1px dashed ${C.border}` }} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function UnscheduleZone({ onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <div onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault(); setOver(false);
        onDrop(parseInt(e.dataTransfer.getData("taskId"), 10));
      }}
      style={{
        marginTop: 8, padding: "7px 14px", borderRadius: 8,
        border: `2px dashed ${over ? "#ef4444" : C.border}`,
        background: over ? "#fff1f2" : "transparent",
        textAlign: "center", fontSize: 10,
        color: over ? "#ef4444" : C.subLight,
        transition: "all .15s", cursor: "default"
      }}>
      ↩ Kéo task vào đây để huỷ lịch
    </div>
  );
}

function UnscheduledPanel({ tasks }) {
  const grouped = groupByType(tasks);
  const [collapsed, setCollapsed] = useState({});
  const toggle = name => setCollapsed(p => ({ ...p, [name]: !p[name] }));

  if (Object.keys(grouped).length === 0)
    return <div style={{ textAlign: "center", padding: 24, color: C.subLight, fontSize: 11 }}>✅ Tất cả task đã được lên lịch</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
      {Object.entries(grouped).map(([typeName, { code, tasks: typeTasks }]) => {
        const col = tc(code);
        const isCollapsed = collapsed[typeName];
        return (
          <div key={typeName} style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", boxShadow: C.shadow }}>
            <div onClick={() => toggle(typeName)}
              style={{
                padding: "6px 10px", background: col.bg,
                borderBottom: isCollapsed ? "none" : `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer"
              }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: col.text, textTransform: "uppercase", letterSpacing: ".5px" }}>
                {typeName}
              </span>
              <span style={{ fontSize: 10, color: col.text }}>{typeTasks.length} · {isCollapsed ? "▸" : "▾"}</span>
            </div>
            {!isCollapsed && typeTasks.map(task => (
              <div key={task.id} draggable
                onDragStart={e => e.dataTransfer.setData("taskId", String(task.id))}
                style={{
                  padding: "6px 10px", borderBottom: `1px solid ${C.border}`,
                  background: C.surface, cursor: "grab", transition: "background .12s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
                onMouseLeave={e => e.currentTarget.style.background = C.surface}>
                <div style={{ fontWeight: 600, fontSize: 11, color: C.text, marginBottom: 2 }}>{task.title}</div>
                {task.note && (
                  <div style={{
                    fontSize: 10, color: C.sub, overflow: "hidden",
                    whiteSpace: "nowrap", textOverflow: "ellipsis"
                  }}>📝 {task.note}</div>
                )}
                <span style={{
                  display: "inline-block", marginTop: 4, fontSize: 9, padding: "1px 6px",
                  borderRadius: 3, background: col.pill, color: col.text,
                  border: `1px solid ${col.border}`, fontWeight: 700, textTransform: "uppercase"
                }}>
                  {code}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function TaskSchedulingPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [scheduledTasks, setScheduled] = useState([]);
  const [unscheduledTasks, setUnscheduled] = useState([]);
  const [allStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignStaffList, setAssignStaffList] = useState([]);
  const [timeModal, setTimeModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [taskTypes, setTaskTypes] = useState([]);
  const [zones, setZones] = useState([]);

  const weekDays = Array.from({ length: 7 }, (_, i) => ({ label: WEEKDAYS[i], date: addDays(weekStart, i) }));

  useEffect(() => {
    getMyWarehouses().then(list => {
      setWarehouses(list);
      if (list.length > 0) setWarehouseId(list[0].warehouseId);
    }).catch(console.error);
    getTaskTypes().then(setTaskTypes).catch(console.error);
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    getWarehouseZones(warehouseId).then(setZones).catch(console.error);
  }, [warehouseId]);

  const loadData = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const res = await getWeekTasks(warehouseId, weekStart);
      setScheduled((res.scheduled || []).map(normalize));
      setUnscheduled((res.unscheduled || []).map(normalize));
    } catch (err) {
      console.error("Lỗi tải tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [weekStart, warehouseId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDropToCell = (taskId, targetDate) => {
    const existing = scheduledTasks.find(t => t.id === taskId && t.scheduledDate === targetDate);
    if (existing) return;
    const task = [...scheduledTasks, ...unscheduledTasks].find(t => t.id === taskId);
    setTimeModal({ taskId, targetDate, taskTitle: task?.title || "" });
  };

  const handleConfirmTime = async (time) => {
    // Compose full ISO datetime: targetDate at HH:MM
    const iso = new Date(`${timeModal.targetDate}T${time}:00`);
    await scheduleTask(timeModal.taskId, iso.toISOString());
    setTimeModal(null);
    loadData();
  };

  const handleUnschedule = async (taskId) => {
    await unscheduleTask(taskId);
    loadData();
  };

  const handleAssignOpen = async (task) => {
    setAssignModal(task);
    setAssignLoading(true);
    setAssignStaffList([]);
    try {
      const staff = await getEligibleStaff(task.id);
      console.log("[EligibleStaff] taskId:", task.id, "result:", staff);
      setAssignStaffList(staff.map(s => ({
        membershipId: s.membershipId,
        fullName: s.fullName,
        roleName: s.roleCode,
      })));
    } catch (e) {
      console.error("[EligibleStaff] Error:", e?.response?.data || e?.message || e);
      setAssignStaffList([]);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignSave = async (membershipIds) => {
    await assignStaff(assignModal.id, membershipIds);
    setAssignModal(null);
    loadData();
  };

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 12
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "12px 20px", background: C.surface, borderBottom: `1px solid ${C.border}`,
        boxShadow: C.shadow
      }}>
        <h2 style={{ fontWeight: 800, fontSize: 15, color: C.text, margin: 0 }}>📅 Task Scheduling</h2>
        {warehouses.length > 1 && (
          <select
            value={warehouseId ?? ""}
            onChange={e => setWarehouseId(Number(e.target.value))}
            style={{
              padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text, fontSize: 11, cursor: "pointer",
              fontWeight: 600, outline: "none"
            }}
          >
            {warehouses.map(w => (
              <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>
            ))}
          </select>
        )}
        {warehouses.length === 1 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, padding: "4px 10px",
            background: "#eef2ff", borderRadius: 6 }}>
            🏭 {warehouses[0].warehouseName}
          </span>
        )}
        <button onClick={() => setWeekStart(d => addDays(d, -7))}
          style={{
            padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
            background: C.surface, color: C.text, cursor: "pointer", fontSize: 11,
            boxShadow: C.shadow
          }}>
          ← Tuần trước
        </button>
        <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>{fmtWeekRange(weekStart)}</span>
        <button onClick={() => setWeekStart(d => addDays(d, 7))}
          style={{
            padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
            background: C.surface, color: C.text, cursor: "pointer", fontSize: 11,
            boxShadow: C.shadow
          }}>
          Tuần sau →
        </button>
        <button onClick={() => setCreateModal(true)}
          style={{
            marginLeft: "auto", padding: "6px 14px", borderRadius: 7,
            border: `1px solid ${C.accent}`, background: C.accent,
            color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700
          }}>
          + Tạo task
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontSize: 12 }}>
          Đang tải...
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: 14, gap: 12 }}>
          {/* LEFT 70% */}
          <div style={{ flex: "0 0 70%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase",
              letterSpacing: ".7px", marginBottom: 8
            }}>
              Lịch tuần · {scheduledTasks.length} task đã lên lịch
            </div>
            <TimetableGrid weekDays={weekDays} scheduledTasks={scheduledTasks}
              allStaff={allStaff} onAssign={handleAssignOpen} onDropToCell={handleDropToCell} />
            <UnscheduleZone onDrop={handleUnschedule} />
          </div>

          {/* RIGHT 30% */}
          <div style={{ flex: "0 0 calc(30% - 12px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase",
              letterSpacing: ".7px", marginBottom: 8
            }}>
              Chưa lên lịch · {unscheduledTasks.length} task
            </div>
            <UnscheduledPanel tasks={unscheduledTasks} />
          </div>
        </div>
      )}

      {assignModal && (
        <AssignModal task={assignModal} allStaff={assignStaffList} loading={assignLoading}
          onClose={() => setAssignModal(null)} onSave={handleAssignSave} />
      )}
      {timeModal && (
        <SetTimeModal taskTitle={timeModal.taskTitle} targetDate={timeModal.targetDate}
          onClose={() => setTimeModal(null)} onConfirm={handleConfirmTime} />
      )}
      {createModal && (
        <CreateTaskModal
          warehouseId={warehouseId}
          taskTypes={taskTypes}
          zones={zones}
          hasZone={warehouses.find(w => w.warehouseId === warehouseId)?.hasZone ?? false}
          onClose={() => setCreateModal(false)}
          onCreated={() => { setCreateModal(false); loadData(); }}
        />
      )}
    </div>
  );
}
