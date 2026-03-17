import { useState, useEffect, useMemo } from "react";
import axiosClient from "../services/axiosClient";
import { getStaffSchedule, saveShifts } from "../services/shiftSchedulingService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_VN  = ["CN","T2","T3","T4","T5","T6","T7"];
const MONTHS   = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

const getMonday = d => {
  const r = new Date(d), day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0); return r;
};
const addDays     = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const fmt2        = n => String(n).padStart(2, "0");
const fmtD        = d => `${fmt2(d.getDate())}/${fmt2(d.getMonth() + 1)}`;
const isoKey      = d => d.toISOString().split("T")[0];
const todayKey    = isoKey(new Date());

const emptyShift  = () => ({ in1:"", out1:"", in2:"", out2:"", type:"" });

// ─── Palette ──────────────────────────────────────────────────────────────────
const TYPE_STYLE = {
  NC: { bg:"#dbeafe", color:"#1d4ed8", label:"NC" },
  NP: { bg:"#fef3c7", color:"#92400e", label:"NP" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function TimeIn({ val, onChange }) {
  return (
    <input type="time" value={val} onChange={e => onChange(e.target.value)}
      style={{ width:46, border:"none", outline:"none", fontSize:9, background:"transparent",
               color:"#0f172a", padding:0, cursor:"pointer" }} />
  );
}

function DayCell({ shift, onChange }) {
  const ts = TYPE_STYLE[shift.type];
  return (
    <td style={{ border:"1px solid #e2e8f0", verticalAlign:"top", minWidth:84,
                 background:ts ? ts.bg : "#fff", padding:"2px 3px" }}>
      {ts ? (
        <div style={{ textAlign:"center", fontWeight:700, fontSize:9,
                      color:ts.color, padding:"4px 0" }}>{ts.label}</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", columnGap:2, fontSize:9 }}>
          <span style={{ color:"#94a3b8", fontSize:8 }}>Vào</span>
          <span style={{ color:"#94a3b8", fontSize:8 }}>Về</span>
          <TimeIn val={shift.in1}  onChange={v => onChange({ ...shift, in1:v  })} />
          <TimeIn val={shift.out1} onChange={v => onChange({ ...shift, out1:v })} />
          <TimeIn val={shift.in2}  onChange={v => onChange({ ...shift, in2:v  })} />
          <TimeIn val={shift.out2} onChange={v => onChange({ ...shift, out2:v })} />
        </div>
      )}
      <select value={shift.type} onChange={e => onChange({ ...emptyShift(), type:e.target.value })}
        style={{ width:"100%", fontSize:8, border:"1px solid #e2e8f0", borderRadius:2,
                 marginTop:2, padding:"0 2px", background:"#f8fafc",
                 color:"#64748b", cursor:"pointer" }}>
        <option value="">Ca thường</option>
        <option value="NC">NC – Nghỉ ca</option>
        <option value="NP">NP – Nghỉ phép</option>
      </select>
    </td>
  );
}

function TemplateModal({ days, onClose, onApply }) {
  const [t, setT] = useState({
    in1:"07:00", out1:"12:00", in2:"13:00", out2:"16:00",
    sel: Object.fromEntries(days.slice(0, 7).map(d => [d.key, true])),
  });
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)",
               zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:10, padding:"18px 22px",
                    width:340, boxShadow:"0 8px 24px rgba(0,0,0,.14)" }}>
        <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:12 }}>📋 Áp ca mẫu</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:12 }}>
          {["in1","out1","in2","out2"].map((f, i) => (
            <div key={f}>
              <div style={{ fontSize:9, color:"#94a3b8", marginBottom:2 }}>
                {["Vào 1","Về 1","Vào 2","Về 2"][i]}
              </div>
              <input type="time" value={t[f]}
                onChange={e => setT(p => ({ ...p, [f]:e.target.value }))}
                style={{ width:"100%", padding:"4px", borderRadius:5,
                         border:"1px solid #e2e8f0", fontSize:10, boxSizing:"border-box" }} />
            </div>
          ))}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:14 }}>
          {days.slice(0, 7).map(d => (
            <label key={d.key} style={{
              padding:"2px 8px", borderRadius:12, cursor:"pointer", fontSize:10, fontWeight:600,
              background: t.sel[d.key] ? "#3b5bdb" : "#f1f5f9",
              color:      t.sel[d.key] ? "#fff"    : "#64748b",
              border:"1px solid " + (t.sel[d.key] ? "#3b5bdb" : "#e2e8f0"),
              userSelect:"none",
            }}>
              <input type="checkbox" checked={!!t.sel[d.key]}
                onChange={e => setT(p => ({ ...p, sel:{ ...p.sel, [d.key]:e.target.checked } }))}
                style={{ display:"none" }} />
              {d.label}
            </label>
          ))}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:"7px", borderRadius:6, border:"1px solid #e2e8f0",
                     background:"transparent", cursor:"pointer", fontSize:11 }}>Hủy</button>
          <button onClick={() => onApply(t)}
            style={{ flex:1, padding:"7px", borderRadius:6, border:"none",
                     background:"#3b5bdb", color:"#fff", cursor:"pointer",
                     fontSize:11, fontWeight:700 }}>✓ Áp dụng</button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ShiftSchedulingPage() {
  const [warehouses,   setWarehouses]   = useState([]);
  const [warehouseId,  setWarehouseId]  = useState(null);
  const [staffList,    setStaffList]    = useState([]);
  const [shifts,       setShifts]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [mode,         setMode]         = useState("week");
  const [weekStart,    setWeekStart]    = useState(() => getMonday(new Date()));
  const [monthYear,    setMonthYear]    = useState(() => ({ y:new Date().getFullYear(), m:new Date().getMonth() }));
  const [tplOpen,      setTplOpen]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedMsg,     setSavedMsg]     = useState("");

  // ── Load warehouses ────────────────────────────────────────────────────────
  useEffect(() => {
    axiosClient.get("/staff/my-warehouses").then(r => {
      setWarehouses(r.data);
      if (r.data.length > 0) setWarehouseId(r.data[0].warehouseId);
    }).catch(console.error);
  }, []);

  // ── Tính danh sách ngày theo view hiện tại ────────────────────────────────
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
    const from = dayList[0].key;
    const to   = dayList[dayList.length - 1].key;
    getStaffSchedule(whId, from, to)
      .then(data => {
        setStaffList(data);
        const newShifts = {};
        data.forEach(s => {
          newShifts[s.membershipId] = {};
          Object.entries(s.shifts || {}).forEach(([date, slot]) => {
            if (slot) newShifts[s.membershipId][date] = {
              in1:  slot.timeIn1  || "",
              out1: slot.timeOut1 || "",
              in2:  slot.timeIn2  || "",
              out2: slot.timeOut2 || "",
              type: slot.shiftType || "",
            };
          });
        });
        setShifts(newShifts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (warehouseId && days.length > 0) loadSchedule(warehouseId, days);
  }, [warehouseId, days]);

  const getShift = (id, k) => shifts[id]?.[k] || emptyShift();
  const setShift = (id, k, v) => setShifts(p => ({ ...p, [id]:{ ...p[id], [k]:v } }));

  const applyTpl = t => {
    const selKeys = new Set(Object.entries(t.sel).filter(([,v]) => v).map(([k]) => k));
    setShifts(p => {
      const n = { ...p };
      staffList.forEach(s => {
        n[s.membershipId] = { ...n[s.membershipId] };
        days.forEach(d => {
          const weekDayKey = mode === "week" ? d.key : days.slice(0, 7)[d.date.getDay() === 0 ? 6 : d.date.getDay() - 1]?.key;
          if (selKeys.has(d.key) || selKeys.has(weekDayKey)) {
            n[s.membershipId][d.key] = { in1:t.in1, out1:t.out1, in2:t.in2, out2:t.out2, type:"" };
          }
        });
      });
      return n;
    });
    setTplOpen(false);
  };

  const reloadShifts = () => loadSchedule(warehouseId, days);

  const handleSave = async () => {
    setSaving(true);
    try {
      const visibleKeys = new Set(days.map(d => d.key));
      const payload = [];
      staffList.forEach(s => {
        Object.entries(shifts[s.membershipId] || {}).forEach(([date, shift]) => {
          if (!visibleKeys.has(date)) return;
          payload.push({
            membershipId: s.membershipId,
            shiftDate:    date,
            timeIn1:      shift.in1  || null,
            timeOut1:     shift.out1 || null,
            timeIn2:      shift.in2  || null,
            timeOut2:     shift.out2 || null,
            shiftType:    shift.type || null,
          });
        });
      });
      await saveShifts(payload);
      reloadShifts();
      setSavedMsg("Đã lưu!");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      setSavedMsg("Lỗi khi lưu!");
      setTimeout(() => setSavedMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filtered = staffList.filter(s => {
    const q = search.toLowerCase();
    return !q || s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  const warehouseName = warehouses.find(w => w.warehouseId === warehouseId)?.warehouseName || "";
  const periodLabel   = mode === "week"
    ? `${fmtD(weekStart)} – ${fmtD(addDays(weekStart, 6))}`
    : `${MONTHS[monthYear.m]} ${monthYear.y}`;

  // ── Styles ──
  const S = {
    sel: { padding:"4px 8px", borderRadius:6, border:"1px solid #e2e8f0",
           background:"#fff", fontSize:10, color:"#334155", outline:"none" },
    nav: { padding:"3px 9px", borderRadius:5, border:"1px solid #e2e8f0",
           background:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, lineHeight:1 },
    btn: { padding:"5px 11px", borderRadius:6, border:"1px solid #e2e8f0",
           background:"#fff", cursor:"pointer", fontSize:10, fontWeight:600, color:"#334155" },
    th:  { padding:"5px 5px", fontWeight:700, fontSize:9, color:"#fff",
           borderRight:"1px solid rgba(255,255,255,.12)", textTransform:"uppercase",
           letterSpacing:".3px", whiteSpace:"nowrap" },
  };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", fontSize:12,
                  background:"#f8fafc", borderRadius:8,
                  maxWidth:"100%", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                    background:"#fff", borderRadius:"8px 8px 0 0",
                    border:"1px solid #e2e8f0", borderBottom:"none",
                    flexWrap:"wrap", userSelect:"none" }}>

        <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>🗓 Lịch ca</span>

        {warehouses.length > 1
          ? <select value={warehouseId ?? ""} onChange={e => setWarehouseId(Number(e.target.value))}
              style={S.sel}>
              {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
            </select>
          : warehouseName
            ? <span style={{ fontSize:10, fontWeight:600, color:"#3b5bdb",
                             background:"#eef2ff", padding:"3px 8px", borderRadius:5 }}>
                🏭 {warehouseName}
              </span>
            : null}

        {/* Toggle Tuần / Tháng */}
        <div style={{ display:"flex", border:"1px solid #e2e8f0", borderRadius:6, overflow:"hidden" }}>
          {["week","month"].map(v => (
            <button key={v} onClick={() => setMode(v)}
              style={{ padding:"4px 11px", border:"none", cursor:"pointer", fontSize:10, fontWeight:600,
                       background:mode===v ? "#3b5bdb":"#fff",
                       color:mode===v ? "#fff":"#64748b" }}>
              {v === "week" ? "Tuần" : "Tháng"}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <button style={S.nav} onClick={() => mode === "week"
            ? setWeekStart(d => addDays(d, -7))
            : setMonthYear(p => { const m=p.m===0?11:p.m-1; return { y:p.m===0?p.y-1:p.y, m }; })}>‹</button>
          <span style={{ fontSize:10, fontWeight:600, color:"#334155",
                         background:"#f1f5f9", padding:"3px 10px", borderRadius:5 }}>
            {periodLabel}
          </span>
          <button style={S.nav} onClick={() => mode === "week"
            ? setWeekStart(d => addDays(d, 7))
            : setMonthYear(p => { const m=p.m===11?0:p.m+1; return { y:p.m===11?p.y+1:p.y, m }; })}>›</button>
        </div>

        <input placeholder="🔍 Tìm nhân viên..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...S.sel, minWidth:150 }} />

        <div style={{ marginLeft:"auto", display:"flex", gap:6, alignItems:"center" }}>
          {savedMsg && (
            <span style={{ fontSize:10,
                           color: savedMsg.startsWith("Lỗi") ? "#b91c1c" : "#15803d",
                           background: savedMsg.startsWith("Lỗi") ? "#fee2e2" : "#dcfce7",
                           padding:"3px 8px", borderRadius:5, fontWeight:600 }}>
              {savedMsg.startsWith("Lỗi") ? "✗" : "✓"} {savedMsg}
            </span>
          )}
          <button style={S.btn} onClick={() => setTplOpen(true)}>📋 Ca mẫu</button>
          <button disabled={saving} onClick={handleSave}
            style={{ ...S.btn, background:saving?"#9ca3af":"#3b5bdb",
                     color:"#fff", border:"none" }}>
            {saving ? "..." : "💾 Lưu"}
          </button>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:8, padding:"4px 12px", background:"#fff",
                    border:"1px solid #e2e8f0", borderBottom:"none", alignItems:"center" }}>
        <span style={{ fontSize:9, color:"#94a3b8", fontWeight:700 }}>Chú thích:</span>
        {[
          { label:"Ca thường", bg:"#fff",    color:"#64748b", bd:"#e2e8f0" },
          { label:"NC – Nghỉ ca",  bg:"#dbeafe", color:"#1d4ed8", bd:"transparent" },
          { label:"NP – Nghỉ phép", bg:"#fef3c7", color:"#92400e", bd:"transparent" },
        ].map(it => (
          <span key={it.label}
            style={{ fontSize:9, padding:"1px 7px", borderRadius:8, fontWeight:600,
                     background:it.bg, color:it.color, border:`1px solid ${it.bd}` }}>
            {it.label}
          </span>
        ))}
        <span style={{ marginLeft:"auto", fontSize:9, color:"#94a3b8" }}>
          {filtered.length} nhân viên
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{
        height: "calc(100vh - 250px)",
        overflowX: "auto", overflowY: "auto",
        border: "1px solid #e2e8f0", borderRadius: "0 0 8px 8px",
        background: "#fff", isolation: "isolate",
      }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        height:"100%", color:"#94a3b8", fontSize:12 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        height:"100%", color:"#cbd5e1", fontSize:12 }}>Không có nhân viên.</div>
        ) : (
          <table style={{ borderCollapse:"collapse", tableLayout:"fixed", minWidth:"100%" }}>
            <thead style={{ position:"sticky", top:0, zIndex:10 }}>
              <tr>
                <th style={{ ...S.th, width:28, minWidth:28, background:"#1e293b",
                             position:"sticky", left:0, zIndex:11 }}>#</th>
                <th style={{ ...S.th, minWidth:140, textAlign:"left", background:"#1e293b",
                             position:"sticky", left:28, zIndex:11,
                             borderRight:"1px solid rgba(255,255,255,.15)" }}>Nhân viên</th>
                {days.map(d => {
                  const weekend = d.date.getDay() === 0 || d.date.getDay() === 6;
                  const today   = d.key === todayKey;
                  return (
                    <th key={d.key} style={{
                      ...S.th, minWidth:84, textAlign:"center",
                      background: today ? "#3b5bdb" : weekend ? "#374151" : "#1e293b",
                      borderBottom: today ? "2px solid #818cf8" : undefined,
                    }}>
                      <div>{d.label}</div>
                      <div style={{ fontSize:8, opacity:.7 }}>
                        {fmt2(d.date.getDate())}/{fmt2(d.date.getMonth()+1)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filtered.map((s, idx) => {
                const isEven  = idx % 2 === 0;
                const rowBg   = isEven ? "#fff" : "#f8fafc";
                const roleCol = s.roleCode === "MANAGER"
                  ? { bg:"#dbeafe", color:"#1d4ed8" }
                  : { bg:"#dcfce7", color:"#15803d" };
                return (
                  <tr key={s.membershipId} style={{ background:rowBg }}>
                    <td style={{ border:"1px solid #e2e8f0", textAlign:"center",
                                 fontSize:9, color:"#94a3b8", fontWeight:600,
                                 background:rowBg, position:"sticky", left:0, zIndex:2,
                                 width:28, minWidth:28 }}>
                      {idx + 1}
                    </td>
                    <td style={{ border:"1px solid #e2e8f0", padding:"4px 6px",
                                 background:rowBg, position:"sticky", left:28, zIndex:2,
                                 minWidth:140, maxWidth:160,
                                 borderRight:"2px solid #e2e8f0" }}>
                      <div style={{ fontWeight:600, fontSize:10, color:"#0f172a",
                                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {s.fullName}
                      </div>
                      <div style={{ fontSize:9, color:"#94a3b8", whiteSpace:"nowrap",
                                    overflow:"hidden", textOverflow:"ellipsis" }}>
                        {s.email}
                      </div>
                      <span style={{ fontSize:8, padding:"1px 5px", borderRadius:8,
                                     fontWeight:700, background:roleCol.bg, color:roleCol.color }}>
                        {s.roleCode}
                      </span>
                    </td>
                    {days.map(d => (
                      <DayCell key={d.key}
                        shift={getShift(s.membershipId, d.key)}
                        onChange={v => setShift(s.membershipId, d.key, v)} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {tplOpen && (
        <TemplateModal days={days} onClose={() => setTplOpen(false)} onApply={applyTpl} />
      )}
    </div>
  );
}
