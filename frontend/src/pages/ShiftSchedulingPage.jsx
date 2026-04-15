import { useState, useEffect, useMemo, useRef } from "react";
import axiosClient from "../services/axiosClient";
import { getStaffSchedule, saveShifts } from "../services/shiftSchedulingService";
import warehouseShiftService from "../services/shiftPresetService";
import attendanceService from "../services/attendanceService";

// ── Helpers
const DAYS_VN  = ["CN","T2","T3","T4","T5","T6","T7"];
const MONTHS   = ["Thang 1","Thang 2","Thang 3","Thang 4","Thang 5","Thang 6",
                  "Thang 7","Thang 8","Thang 9","Thang 10","Thang 11","Thang 12"];

const getMonday = d => {
  const r = new Date(d), day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0); return r;
};
const addDays     = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const fmt2        = n => String(n).padStart(2, "0");
const fmtD        = d => `${fmt2(d.getDate())}/${fmt2(d.getMonth() + 1)}`;
const isoKey      = d => `${d.getFullYear()}-${fmt2(d.getMonth()+1)}-${fmt2(d.getDate())}`;
const todayKey    = isoKey(new Date());
const emptyShift  = () => ({ in1:"", out1:"", type:"", ot:0 });

const fmtTime = iso => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}`;
};

// ── Palette
const TYPE_STYLE = {
  NC: { bg:"#dbeafe", color:"#1d4ed8", label:"NC" },
  NP: { bg:"#fef3c7", color:"#92400e", label:"NP" },
};

// ── AttendanceInfo row
function AttendanceStrip({ slot }) {
  const inTime  = fmtTime(slot?.checkInAt);
  const outTime = fmtTime(slot?.checkOutAt);
  if (!inTime && !outTime) return null;
  return (
    <div style={{ marginTop:2, display:"flex", flexDirection:"column", gap:1 }}>
      {inTime && (
        <div style={{ fontSize:7, background:"#d1fae5", color:"#065f46", borderRadius:3, padding:"1px 4px", fontWeight:700 }}>
          V: {inTime}
        </div>
      )}
      {outTime && (
        <div style={{ fontSize:7,
          background: slot.isEarlyLeave ? "#fef3c7" : "#dbeafe",
          color:      slot.isEarlyLeave ? "#92400e" : "#1d4ed8",
          borderRadius:3, padding:"1px 4px", fontWeight:700 }}>
          R: {outTime}{slot.isEarlyLeave ? " (S)" : ""}
        </div>
      )}
    </div>
  );
}

// ── AttendanceDetailModal: click vao strip nho de xem chi tiet
function AttendanceDetailModal({ staffName, dateKey, slot, onClose }) {
  const [showInPhoto,  setShowInPhoto]  = useState(false);
  const [showOutPhoto, setShowOutPhoto] = useState(false);
  if (!slot) return null;

  const overlay = {
    position:"fixed", inset:0, background:"rgba(0,0,0,.5)",
    display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000,
  };
  const card = {
    background:"#fff", borderRadius:12, padding:24, width:340, maxWidth:"90vw",
    boxShadow:"0 16px 48px rgba(0,0,0,.2)", fontFamily:"Inter,sans-serif",
  };

  const fmtDT = iso => {
    if (!iso) return "--";
    const d = new Date(iso);
    return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())} ${d.getDate()}/${fmt2(d.getMonth()+1)}`;
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight:800, fontSize:"1rem", color:"#0f172a", marginBottom:4 }}>{staffName}</div>
        <div style={{ fontSize:"0.8rem", color:"#64748b", marginBottom:16 }}>{dateKey}</div>

        {slot.checkInAt ? (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#16a34a" }} />
              <span style={{ fontWeight:700, fontSize:"0.82rem" }}>Giờ vào:</span>
              <span style={{ fontSize:"0.83rem" }}>{fmtDT(slot.checkInAt)}</span>
              {slot.checkInPhoto && (
                <span style={{ fontSize:"0.72rem", color:"#3b82f6", cursor:"pointer", textDecoration:"underline" }}
                  onClick={() => setShowInPhoto(x => !x)}>
                  {showInPhoto ? "Ẩn" : "Xem ảnh"}
                </span>
              )}
            </div>
            {showInPhoto && slot.checkInPhoto && (
              <img src={slot.checkInPhoto} alt="check-in" style={{ marginTop:6, maxWidth:"100%", borderRadius:6, maxHeight:160 }} />
            )}
          </div>
        ) : (
          <div style={{ marginBottom:12, fontSize:"0.82rem", color:"#94a3b8" }}>Chưa vào ca</div>
        )}

        {slot.checkOutAt ? (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6" }} />
              <span style={{ fontWeight:700, fontSize:"0.82rem" }}>Giờ ra:</span>
              <span style={{ fontSize:"0.83rem" }}>{fmtDT(slot.checkOutAt)}</span>
              {slot.isEarlyLeave && (
                <span style={{ fontSize:"0.7rem", background:"#fef3c7", color:"#92400e",
                  borderRadius:4, padding:"1px 6px", fontWeight:700 }}>Về sớm</span>
              )}
              {slot.checkOutPhoto && (
                <span style={{ fontSize:"0.72rem", color:"#3b82f6", cursor:"pointer", textDecoration:"underline" }}
                  onClick={() => setShowOutPhoto(x => !x)}>
                  {showOutPhoto ? "Ẩn" : "Xem ảnh"}
                </span>
              )}
            </div>
            {showOutPhoto && slot.checkOutPhoto && (
              <img src={slot.checkOutPhoto} alt="check-out" style={{ marginTop:6, maxWidth:"100%", borderRadius:6, maxHeight:160 }} />
            )}
          </div>
        ) : (
          <div style={{ marginBottom:12, fontSize:"0.82rem", color:"#94a3b8" }}>Chưa ra ca</div>
        )}

        <button onClick={onClose} style={{ marginTop:8, width:"100%", padding:"8px", borderRadius:7,
          border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", fontWeight:600, fontSize:"0.85rem" }}>
          Dong
        </button>
      </div>
    </div>
  );
}

// ── DayCell with preset popover + OT input + attendance strip
function DayCell({ shift, slotData, onChange, presets }) {
  const [open,      setOpen]      = useState(false);
  const [showDetail, setDetail]   = useState(false);
  const ref = useRef(null);
  const ts  = TYPE_STYLE[shift.type];

  useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const applyPreset = p => {
    onChange({ in1: p.startTime, out1: p.endTime, type: "", ot: shift.ot || 0 });
    setOpen(false);
  };

  const hasAttendance = slotData?.checkInAt || slotData?.checkOutAt;

  return (
    <td style={{ border:"1px solid #e2e8f0", verticalAlign:"top", minWidth:84,
                 background: ts ? ts.bg : "#fff", padding:"2px 3px", position:"relative" }}>
      {/* Main cell click opens popover */}
      <div onClick={() => setOpen(o => !o)} style={{ cursor:"pointer", minHeight:28 }}>
        {ts ? (
          <div style={{ textAlign:"center", fontWeight:700, fontSize:9, color:ts.color, padding:"4px 0" }}>
            {ts.label}
          </div>
        ) : shift.in1 || shift.out1 ? (() => {
          const overnight = shift.in1 && shift.out1 && shift.out1 < shift.in1;
          return (
            <div style={{ fontSize:9, color:"#0f172a", lineHeight:1.6, padding:"2px 0" }}>
              <span style={{ color:"#94a3b8", fontSize:8 }}>V: </span>{shift.in1 || "--"}
              <br/>
              <span style={{ color:"#94a3b8", fontSize:8 }}>R: </span>{shift.out1 || "--"}
              {overnight && <span style={{ color:"#f59e0b", fontSize:7, fontWeight:700 }}> +1</span>}
              {shift.ot > 0 && (
                <div style={{ fontSize:7, color:"#b45309", fontWeight:700 }}>OT +{shift.ot}h</div>
              )}
            </div>
          );
        })() : (
          <div style={{ fontSize:8, color:"#cbd5e1", textAlign:"center", paddingTop:6 }}>+ Ca</div>
        )}
      </div>

      {/* Attendance strip (small) */}
      {hasAttendance && (
        <div onClick={e => { e.stopPropagation(); setDetail(true); }} style={{ cursor:"pointer" }}>
          <AttendanceStrip slot={slotData} />
        </div>
      )}

      {/* Attendance detail modal */}
      {showDetail && (
        <AttendanceDetailModal
          staffName=""
          dateKey=""
          slot={slotData}
          onClose={() => setDetail(false)}
        />
      )}

      {/* Popover */}
      {open && (
        <div ref={ref} style={{
          position:"absolute", top:"100%", left:0, zIndex:200,
          background:"#fff", border:"1px solid #e2e8f0", borderRadius:8,
          boxShadow:"0 4px 16px rgba(0,0,0,.14)", padding:"8px 10px",
          minWidth:190, width:"max-content",
        }}>
          {presets.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                            letterSpacing:".4px", marginBottom:5 }}>Ca mẫu</div>
              {presets.map(p => (
                <div key={p.id} onClick={() => applyPreset(p)}
                  style={{ fontSize:10, padding:"4px 6px", borderRadius:5, cursor:"pointer",
                           color:"#0f172a", fontWeight:600, display:"flex", justifyContent:"space-between", gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span>{p.name}</span>
                  <span style={{ color:"#64748b", fontWeight:400 }}>{p.startTime}-{p.endTime}</span>
                </div>
              ))}
            </div>
          )}

          {/* Manual input */}
          <div style={{ borderTop: presets.length > 0 ? "1px solid #f1f5f9" : "none",
                        paddingTop: presets.length > 0 ? 8 : 0 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                          letterSpacing:".4px", marginBottom:5 }}>Nhập tay</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:6 }}>
              {["in1","out1"].map((f, i) => (
                <div key={f}>
                  <div style={{ fontSize:8, color:"#94a3b8", marginBottom:2 }}>{["Vào","Ra"][i]}</div>
                  <input type="time" value={shift[f] || ""}
                    onChange={e => onChange({ ...shift, [f]: e.target.value })}
                    style={{ width:"100%", padding:"3px 4px", borderRadius:4,
                             border:"1px solid #e2e8f0", fontSize:10, boxSizing:"border-box" }} />
                </div>
              ))}
            </div>

            {/* OT hours input */}
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:8, color:"#94a3b8", marginBottom:2 }}>Tăng ca (giờ)</div>
              <input type="number" min="0" max="12" step="0.5"
                value={shift.ot || 0}
                onChange={e => onChange({ ...shift, ot: parseFloat(e.target.value) || 0 })}
                style={{ width:"100%", padding:"3px 4px", borderRadius:4,
                         border:"1px solid #e2e8f0", fontSize:10, boxSizing:"border-box" }} />
            </div>
          </div>

          {/* Status */}
          <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:6 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                          letterSpacing:".4px", marginBottom:4 }}>Trạng thái</div>
            <select value={shift.type || ""} onChange={e => { onChange({ ...emptyShift(), type: e.target.value }); setOpen(false); }}
              style={{ width:"100%", fontSize:10, border:"1px solid #e2e8f0", borderRadius:4,
                       padding:"3px 4px", background:"#f8fafc", color:"#64748b" }}>
              <option value="">Ca thường</option>
              <option value="NC">NC - Nghi ca</option>
              <option value="NP">NP - Nghi phep</option>
            </select>
          </div>

          <button onClick={() => { onChange(emptyShift()); setOpen(false); }}
            style={{ width:"100%", marginTop:6, padding:"4px 0", fontSize:9, border:"1px solid #fecaca",
                     borderRadius:4, background:"#fff1f2", color:"#dc2626", cursor:"pointer", fontWeight:600 }}>
            Xoa
          </button>
        </div>
      )}
    </td>
  );
}

// ── OvertimeModal: tao tang ca hang loat cho nhieu nhan vien trong 1 ngay
function OvertimeModal({ warehouseId, staffList, onClose, onDone }) {
  const [date,    setDate]    = useState(isoKey(new Date()));
  const [hours,   setHours]   = useState(2);
  const [selected, setSelected] = useState(() => new Set(staffList.map(s => s.membershipId)));
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const toggleAll = () => {
    if (selected.size === staffList.length) setSelected(new Set());
    else setSelected(new Set(staffList.map(s => s.membershipId)));
  };

  const toggle = id => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleSubmit = async () => {
    if (selected.size === 0) { setErr("Vui lòng chọn ít nhất 1 nhân viên."); return; }
    setSaving(true); setErr("");
    try {
      await attendanceService.bulkSetOvertime(
        warehouseId, date, [...selected], hours
      );
      onDone();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || "Có lỗi xảy ra.");
    } finally { setSaving(false); }
  };

  const overlay = {
    position:"fixed", inset:0, background:"rgba(0,0,0,.5)",
    display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000,
  };
  const card = {
    background:"#fff", borderRadius:12, padding:24, width:400, maxWidth:"92vw",
    maxHeight:"80vh", overflowY:"auto",
    boxShadow:"0 16px 48px rgba(0,0,0,.2)", fontFamily:"Inter,sans-serif",
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight:800, fontSize:"1rem", color:"#0f172a", marginBottom:16 }}>Tạo tăng ca</div>

        {/* Ngay */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:"0.8rem", fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>Ngày</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:"1px solid #e2e8f0",
              fontSize:"0.88rem", boxSizing:"border-box" }} />
        </div>

        {/* So gio OT */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:"0.8rem", fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>
            So gio tang ca
          </label>
          <input type="number" min="0.5" max="12" step="0.5" value={hours}
            onChange={e => setHours(parseFloat(e.target.value) || 0)}
            style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:"1px solid #e2e8f0",
              fontSize:"0.88rem", boxSizing:"border-box" }} />
        </div>

        {/* Danh sach nhan vien */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <label style={{ fontSize:"0.8rem", fontWeight:700, color:"#374151" }}>
              Nhan vien ({selected.size}/{staffList.length})
            </label>
            <button onClick={toggleAll} style={{ fontSize:"0.72rem", color:"#3b82f6", background:"none",
              border:"none", cursor:"pointer", fontWeight:600 }}>
              {selected.size === staffList.length ? "Bỏ tất cả" : "Chọn tất cả"}
            </button>
          </div>
          <div style={{ border:"1px solid #e2e8f0", borderRadius:8, maxHeight:200, overflowY:"auto" }}>
            {staffList.map((s, i) => (
              <label key={s.membershipId} style={{
                display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer",
                borderBottom: i < staffList.length-1 ? "1px solid #f1f5f9" : "none",
                background: selected.has(s.membershipId) ? "#f0f9ff" : "#fff",
              }}>
                <input type="checkbox" checked={selected.has(s.membershipId)}
                  onChange={() => toggle(s.membershipId)} style={{ accentColor:"#3b82f6" }} />
                <span>
                  <div style={{ fontWeight:600, fontSize:"0.83rem", color:"#0f172a" }}>{s.fullName}</div>
                  <div style={{ fontSize:"0.72rem", color:"#94a3b8" }}>{s.email}</div>
                </span>
              </label>
            ))}
          </div>
        </div>

        {err && <div style={{ color:"#dc2626", fontSize:"0.8rem", marginBottom:10 }}>{err}</div>}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", borderRadius:8,
            border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", fontWeight:600, fontSize:"0.85rem" }}>
            Huy
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex:1, padding:"9px", borderRadius:8,
            border:"none", background: saving ? "#9ca3af" : "#f59e0b",
            color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.85rem" }}>
            {saving ? "Đang lưu..." : "Tạo tăng ca"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page
export default function ShiftSchedulingPage() {
  const [warehouses,   setWarehouses]   = useState([]);
  const [warehouseId,  setWarehouseId]  = useState(null);
  const [staffList,    setStaffList]    = useState([]);
  const [slotMap,      setSlotMap]      = useState({});   // { membershipId: { dateKey: slot } }
  const [shifts,       setShifts]       = useState({});   // edit state
  const [presets,      setPresets]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [mode,         setMode]         = useState("week");
  const [weekStart,    setWeekStart]    = useState(() => getMonday(new Date()));
  const [monthYear,    setMonthYear]    = useState(() => ({ y:new Date().getFullYear(), m:new Date().getMonth() }));
  const [saving,       setSaving]       = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [genModal,     setGenModal]     = useState(false);
  const [genFrom,      setGenFrom]      = useState("");
  const [genTo,        setGenTo]        = useState("");
  const [savedMsg,     setSavedMsg]     = useState("");
  const [otModal,      setOtModal]      = useState(false);

  useEffect(() => {
    axiosClient.get("/staff/my-warehouses").then(r => {
      setWarehouses(r.data);
      if (r.data.length > 0) setWarehouseId(r.data[0].warehouseId);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    warehouseShiftService.getWarehouseShifts(warehouseId).then(setPresets).catch(console.error);
  }, [warehouseId]);

  const days = useMemo(() => {
    if (mode === "week") {
      return Array.from({ length:7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return { key:isoKey(d), label:DAYS_VN[d.getDay()], date:d };
      });
    }
    const cnt = daysInMonth(monthYear.y, monthYear.m);
    return Array.from({ length:cnt }, (_, i) => {
      const d = new Date(monthYear.y, monthYear.m, i + 1);
      return { key:isoKey(d), label:DAYS_VN[d.getDay()], date:d };
    });
  }, [mode, weekStart, monthYear]);

  const loadSchedule = (whId, dayList) => {
    if (!whId || dayList.length === 0) return;
    setLoading(true);
    getStaffSchedule(whId, dayList[0].key, dayList[dayList.length - 1].key)
      .then(data => {
        setStaffList(data);
        const ns = {};
        const sm = {};
        data.forEach(s => {
          ns[s.membershipId] = {};
          sm[s.membershipId] = {};
          Object.entries(s.shifts || {}).forEach(([date, slot]) => {
            if (!slot) return;
            ns[s.membershipId][date] = {
              in1: slot.timeIn1 || "", out1: slot.timeOut1 || "",
              type: slot.shiftType || "", ot: slot.overtimeHours || 0,
            };
            sm[s.membershipId][date] = slot; // raw slot with attendance fields
          });
        });
        setShifts(ns);
        setSlotMap(sm);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (warehouseId && days.length > 0) loadSchedule(warehouseId, days); }, [warehouseId, days]);

  const getShift = (id, k) => shifts[id]?.[k] || emptyShift();
  const setShift = (id, k, v) => setShifts(p => ({ ...p, [id]:{ ...p[id], [k]:v } }));
  const reload   = () => loadSchedule(warehouseId, days);

  const handleSave = async () => {
    setSaving(true);
    try {
      const keys    = new Set(days.map(d => d.key));
      const payload = [];
      staffList.forEach(s => {
        Object.entries(shifts[s.membershipId] || {}).forEach(([date, sh]) => {
          if (!keys.has(date)) return;
          payload.push({
            membershipId: s.membershipId, shiftDate: date,
            timeIn1: sh.in1||null, timeOut1: sh.out1||null,
            timeIn2: null, timeOut2: null,
            shiftType: sh.type||null,
            overtimeHours: sh.ot || 0,
          });
        });
      });
      await saveShifts(payload);
      reload();
      setSavedMsg("Đã lưu!"); setTimeout(() => setSavedMsg(""), 2500);
    } catch(e) {
      const msg = e?.response?.data?.message || "Lỗi khi lưu!";
      setSavedMsg(msg); setTimeout(() => setSavedMsg(""), 3500);
    }
    finally { setSaving(false); }
  };

  const handleGenerate = async () => {
    if (!warehouseId || !genFrom || !genTo) return;
    setGenerating(true);
    setGenModal(false);
    try {
      const res = await warehouseShiftService.generateSchedule(warehouseId, genFrom, genTo);
      setSavedMsg(`${res.message}`); setTimeout(() => setSavedMsg(""), 4000);
      reload();
    } catch { setSavedMsg("Lỗi tạo lịch tự động!"); setTimeout(() => setSavedMsg(""), 3000); }
    finally { setGenerating(false); }
  };

  const openGenModal = () => {
    const today = new Date();
    setGenFrom(isoKey(today));
    setGenTo(isoKey(addDays(today, 6)));
    setGenModal(true);
  };

  const filtered = staffList.filter(s => {
    const q = search.toLowerCase();
    return !q || s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  const warehouseName = warehouses.find(w => w.warehouseId === warehouseId)?.warehouseName || "";
  const periodLabel   = mode === "week"
    ? `${fmtD(weekStart)} - ${fmtD(addDays(weekStart, 6))}`
    : `${MONTHS[monthYear.m]} ${monthYear.y}`;

  const S = {
    sel: { padding:"4px 8px", borderRadius:6, border:"1px solid #e2e8f0", background:"#fff", fontSize:10, color:"#334155", outline:"none" },
    nav: { padding:"3px 9px", borderRadius:5, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, lineHeight:1 },
    btn: { padding:"5px 11px", borderRadius:6, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:10, fontWeight:600, color:"#334155" },
    th:  { padding:"5px 5px", fontWeight:700, fontSize:9, color:"#fff", borderRight:"1px solid rgba(255,255,255,.12)", textTransform:"uppercase", letterSpacing:".3px", whiteSpace:"nowrap" },
  };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", fontSize:12, background:"#f8fafc", borderRadius:8, maxWidth:"100%", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#fff",
                    borderRadius:"8px 8px 0 0", border:"1px solid #e2e8f0", borderBottom:"none", flexWrap:"wrap", userSelect:"none" }}>
        <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>Lịch ca</span>

        {warehouses.length > 1
          ? <select value={warehouseId ?? ""} onChange={e => setWarehouseId(Number(e.target.value))} style={S.sel}>
              {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
            </select>
          : warehouseName
            ? <span style={{ fontSize:10, fontWeight:600, color:"#3b5bdb", background:"#eef2ff", padding:"3px 8px", borderRadius:5 }}>{warehouseName}</span>
            : null}

        <div style={{ display:"flex", border:"1px solid #e2e8f0", borderRadius:6, overflow:"hidden" }}>
          {["week","month"].map(v => (
            <button key={v} onClick={() => setMode(v)}
              style={{ padding:"4px 11px", border:"none", cursor:"pointer", fontSize:10, fontWeight:600,
                       background:mode===v?"#3b5bdb":"#fff", color:mode===v?"#fff":"#64748b" }}>
              {v === "week" ? "Tuan" : "Thang"}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <button style={S.nav} onClick={() => mode==="week"
            ? setWeekStart(d => addDays(d,-7))
            : setMonthYear(p => { const m=p.m===0?11:p.m-1; return{y:p.m===0?p.y-1:p.y,m}; })}>‹</button>
          <span style={{ fontSize:10, fontWeight:600, color:"#334155", background:"#f1f5f9", padding:"3px 10px", borderRadius:5 }}>{periodLabel}</span>
          <button style={S.nav} onClick={() => mode==="week"
            ? setWeekStart(d => addDays(d,7))
            : setMonthYear(p => { const m=p.m===11?0:p.m+1; return{y:p.m===11?p.y+1:p.y,m}; })}>›</button>
        </div>

        <input placeholder="Tìm nhân viên..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.sel, minWidth:150 }} />

        <div style={{ marginLeft:"auto", display:"flex", gap:6, alignItems:"center" }}>
          {savedMsg && (
            <span style={{ fontSize:10, color: savedMsg.startsWith("Da")?"#15803d":"#b91c1c",
                           background: savedMsg.startsWith("Da")?"#dcfce7":"#fee2e2",
                           padding:"3px 8px", borderRadius:5, fontWeight:600 }}>
              {savedMsg}
            </span>
          )}
          <button style={{ ...S.btn, background:"#8b5cf6", color:"#fff", border:"none" }}
            onClick={() => setOtModal(true)}>
            Tăng ca
          </button>
          <button style={{ ...S.btn, background:generating?"#9ca3af":"#f59e0b", color:"#fff", border:"none" }}
            disabled={generating} onClick={openGenModal}>
            {generating ? "..." : "Tạo lịch"}
          </button>
          <button disabled={saving} onClick={handleSave}
            style={{ ...S.btn, background:saving?"#9ca3af":"#3b5bdb", color:"#fff", border:"none" }}>
            {saving ? "..." : "Lưu"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:8, padding:"4px 12px", background:"#fff", border:"1px solid #e2e8f0", borderBottom:"none", alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:9, color:"#94a3b8", fontWeight:700 }}>Chú thích:</span>
        {[
          { label:"Ca thuong",    bg:"#fff",    color:"#64748b", bd:"#e2e8f0" },
          { label:"NC - Nghi ca", bg:"#dbeafe", color:"#1d4ed8", bd:"transparent" },
          { label:"NP - Nghi phep", bg:"#fef3c7", color:"#92400e", bd:"transparent" },
          { label:"V: vao ca",    bg:"#d1fae5", color:"#065f46", bd:"transparent" },
          { label:"R: ra ca",     bg:"#dbeafe", color:"#1d4ed8", bd:"transparent" },
          { label:"(S): ve som",  bg:"#fef3c7", color:"#92400e", bd:"transparent" },
        ].map(it => (
          <span key={it.label} style={{ fontSize:9, padding:"1px 7px", borderRadius:8, fontWeight:600,
                                        background:it.bg, color:it.color, border:`1px solid ${it.bd}` }}>
            {it.label}
          </span>
        ))}
        <span style={{ marginLeft:"auto", fontSize:9, color:"#94a3b8" }}>{filtered.length} nhân viên</span>
      </div>

      {/* Table */}
      <div style={{ height:"calc(100vh - 270px)", overflowX:"auto", overflowY:"auto",
                    border:"1px solid #e2e8f0", borderRadius:"0 0 8px 8px", background:"#fff", isolation:"isolate" }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#94a3b8", fontSize:12 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#cbd5e1", fontSize:12 }}>Không có nhân viên.</div>
        ) : (
          <table style={{ borderCollapse:"collapse", tableLayout:"fixed", minWidth:"100%" }}>
            <thead style={{ position:"sticky", top:0, zIndex:10 }}>
              <tr>
                <th style={{ ...S.th, width:28, minWidth:28, background:"#1e293b", position:"sticky", left:0, zIndex:11 }}>#</th>
                <th style={{ ...S.th, minWidth:140, textAlign:"left", background:"#1e293b", position:"sticky", left:28, zIndex:11, borderRight:"1px solid rgba(255,255,255,.15)" }}>Nhân viên</th>
                {days.map(d => {
                  const weekend = d.date.getDay()===0||d.date.getDay()===6;
                  const today   = d.key===todayKey;
                  return (
                    <th key={d.key} style={{ ...S.th, minWidth:84, textAlign:"center",
                                             background:today?"#3b5bdb":weekend?"#374151":"#1e293b",
                                             borderBottom:today?"2px solid #818cf8":undefined }}>
                      <div>{d.label}</div>
                      <div style={{ fontSize:8, opacity:.7 }}>{fmt2(d.date.getDate())}/{fmt2(d.date.getMonth()+1)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const isEven = idx%2===0;
                const rowBg  = isEven?"#fff":"#f8fafc";
                const roleCol = s.roleCode==="MANAGER" ? {bg:"#dbeafe",color:"#1d4ed8"} : {bg:"#dcfce7",color:"#15803d"};
                return (
                  <tr key={s.membershipId} style={{ background:rowBg }}>
                    <td style={{ border:"1px solid #e2e8f0", textAlign:"center", fontSize:9, color:"#94a3b8", fontWeight:600, background:rowBg, position:"sticky", left:0, zIndex:2, width:28, minWidth:28 }}>{idx+1}</td>
                    <td style={{ border:"1px solid #e2e8f0", padding:"4px 6px", background:rowBg, position:"sticky", left:28, zIndex:2, minWidth:140, maxWidth:160, borderRight:"2px solid #e2e8f0" }}>
                      <div style={{ fontWeight:600, fontSize:10, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.fullName}</div>
                      <div style={{ fontSize:9, color:"#94a3b8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.email}</div>
                      <span style={{ fontSize:8, padding:"1px 5px", borderRadius:8, fontWeight:700, background:roleCol.bg, color:roleCol.color }}>{s.roleCode}</span>
                    </td>
                    {days.map(d => (
                      <DayCell
                        key={d.key}
                        shift={getShift(s.membershipId, d.key)}
                        slotData={slotMap[s.membershipId]?.[d.key] || null}
                        presets={presets}
                        onChange={v => setShift(s.membershipId, d.key, v)}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Modal */}
      {genModal && (
        <div onClick={e => e.target===e.currentTarget && setGenModal(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:10, padding:"20px 24px", width:320, boxShadow:"0 8px 24px rgba(0,0,0,.18)" }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:12 }}>Tạo lịch tự động</div>
            <div style={{ fontSize:10, color:"#64748b", marginBottom:10 }}>Tạo lịch tự động cho nhân viên đã được gán loại ca.</div>

            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              <button onClick={() => { const n=addDays(new Date(),((8-new Date().getDay())%7)||7); setGenFrom(isoKey(n)); setGenTo(isoKey(addDays(n,6))); }}
                style={{ flex:1, padding:"6px", borderRadius:5, border:"1px solid #e2e8f0", fontSize:10, cursor:"pointer", background:"#f1f5f9", color:"#334155", fontWeight:600 }}>Tuan sau</button>
              <button onClick={() => { const n=addDays(new Date(),((8-new Date().getDay())%7)||7); setGenFrom(isoKey(n)); setGenTo(isoKey(addDays(n,27))); }}
                style={{ flex:1, padding:"6px", borderRadius:5, border:"1px solid #e2e8f0", fontSize:10, cursor:"pointer", background:"#f1f5f9", color:"#334155", fontWeight:600 }}>Thang sau</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              <div>
                <div style={{ fontSize:9, color:"#94a3b8", marginBottom:3 }}>Từ ngày</div>
                <input type="date" value={genFrom} onChange={e => setGenFrom(e.target.value)}
                  style={{ width:"100%", padding:"5px 6px", borderRadius:5, border:"1px solid #e2e8f0", fontSize:10, boxSizing:"border-box" }} />
              </div>
              <div>
                <div style={{ fontSize:9, color:"#94a3b8", marginBottom:3 }}>Đến ngày</div>
                <input type="date" value={genTo} onChange={e => setGenTo(e.target.value)}
                  style={{ width:"100%", padding:"5px 6px", borderRadius:5, border:"1px solid #e2e8f0", fontSize:10, boxSizing:"border-box" }} />
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setGenModal(false)}
                style={{ flex:1, padding:"7px", borderRadius:6, border:"1px solid #e2e8f0", background:"transparent", cursor:"pointer", fontSize:11 }}>Huy</button>
              <button onClick={handleGenerate} disabled={!genFrom||!genTo}
                style={{ flex:1, padding:"7px", borderRadius:6, border:"none", background:(!genFrom||!genTo)?"#9ca3af":"#f59e0b", color:"#fff", cursor:"pointer", fontSize:11, fontWeight:700 }}>Tao lich</button>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Modal */}
      {otModal && (
        <OvertimeModal
          warehouseId={warehouseId}
          staffList={filtered}
          onClose={() => setOtModal(false)}
          onDone={reload}
        />
      )}
    </div>
  );
}
