import { useState, useEffect } from "react";
import axiosClient from "../services/axiosClient";
import authService from "../services/authService";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  accent: "#6366f1",
  accentBg: "#eff0ff",
  danger: "#ef4444",
  dangerBg: "#fef2f2",
  text: "#0f172a",
  sub: "#64748b",
  subLight: "#94a3b8",
  shadow: "0 1px 3px rgba(0,0,0,.08)",
  shadowMd: "0 8px 28px rgba(0,0,0,.14)",
  overlay: "rgba(15,23,42,.5)",
};

// ── Time helpers ─────────────────────────────────────────────────────────────
function calcDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 1440; // overnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}g ${m}p` : `${h} giờ`;
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmModal({ shift, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:C.overlay, zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, borderRadius:14, padding:"28px 32px",
        border:`1px solid ${C.border}`, boxShadow:C.shadowMd, maxWidth:380, width:"100%" }}>
        <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>Xoá ca làm?</div>
        <p style={{ fontSize:13, color:C.sub, marginBottom:20 }}>
          Bạn có chắc muốn xoá ca <strong>"{shift.name}"</strong> ({shift.startTime}–{shift.endTime}) không?
          Hành động này không thể khôi phục.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"9px 0", borderRadius:8, border:`1px solid ${C.border}`,
              background:"transparent", color:C.sub, cursor:"pointer", fontSize:13, fontWeight:600 }}>
            Huỷ
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none",
              background:C.danger, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shift Card ────────────────────────────────────────────────────────────────
function ShiftCard({ shift, onDelete }) {
  const dur = calcDuration(shift.startTime, shift.endTime);
  const isOvernight = shift.endTime < shift.startTime;
  return (
    <div style={{
      background: C.surface, border:`1px solid ${C.border}`, borderRadius:12,
      padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
      gap:12, boxShadow:C.shadow, transition:"box-shadow .15s, transform .1s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowMd; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "none"; }}
    >
      {/* Left: Icon */}
      <div style={{ width:42, height:42, borderRadius:10, background:C.accentBg,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <span className="material-symbols-outlined" style={{ fontSize:22, color:C.accent }}>schedule</span>
      </div>

      {/* Middle: Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:3,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {shift.name}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, color:C.sub, fontWeight:600 }}>
            {shift.startTime} → {shift.endTime}
            {isOvernight && <span style={{ fontSize:10, color:"#f59e0b", fontWeight:700, marginLeft:4 }}>+1 ngày</span>}
          </span>
          {dur && (
            <span style={{ fontSize:11, background:"#f1f5f9", color:C.sub,
              padding:"2px 8px", borderRadius:99, fontWeight:600 }}>
              {dur}
            </span>
          )}
        </div>
      </div>

      {/* Right: Delete */}
      <button onClick={() => onDelete(shift)}
        style={{ width:34, height:34, borderRadius:8, border:`1px solid ${C.border}`,
          background:"transparent", color:C.subLight, cursor:"pointer", display:"flex",
          alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}
        onMouseEnter={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.color = C.danger; e.currentTarget.style.borderColor = "#fecaca"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.subLight; e.currentTarget.style.borderColor = C.border; }}
        title="Xoá ca này"
      >
        <span className="material-symbols-outlined" style={{ fontSize:17 }}>delete</span>
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateShiftPage() {
  const ctx = authService.getWarehouseContext();
  const warehouses = ctx?.warehouses || [];

  // Pick default warehouse — prefer OPERATOR warehouses
  const defaultWh = warehouses.find(w =>
    (w.roles?.includes("OPERATOR") || w.role === "OPERATOR")
  ) || warehouses[0] || null;

  const [selectedWhId, setSelectedWhId] = useState(defaultWh?.warehouseId ?? null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", startTime: "07:00", endTime: "16:00" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inp = {
    width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${C.border}`,
    fontSize:13, color:C.text, background:C.bg, boxSizing:"border-box", outline:"none",
    fontFamily:"inherit",
  };
  const lbl = { display:"block", fontSize:11, fontWeight:700, color:C.sub,
    textTransform:"uppercase", letterSpacing:".5px", marginBottom:5 };

  // Load shifts when warehouse changes
  const loadShifts = async (whId) => {
    if (!whId) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/schedule/warehouse-shifts?warehouseId=${whId}`);
      setShifts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShifts(selectedWhId); }, [selectedWhId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name.trim()) { setError("Vui lòng nhập tên ca."); return; }
    if (!form.startTime || !form.endTime) { setError("Vui lòng chọn giờ vào và giờ ra."); return; }
    if (!selectedWhId) { setError("Không xác định được kho. Vui lòng chọn lại."); return; }

    setSaving(true);
    try {
      await axiosClient.post("/schedule/warehouse-shifts", {
        warehouseId: selectedWhId,
        name: form.name.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setSuccess(`Đã tạo ca "${form.name.trim()}" thành công!`);
      setForm({ name: "", startTime: "07:00", endTime: "16:00" });
      loadShifts(selectedWhId);
      setTimeout(() => setSuccess(""), 3000);
    } catch (ex) {
      setError(ex?.response?.data?.message || "Có lỗi khi tạo ca. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shift) => {
    setDeleteTarget(null);
    try {
      await axiosClient.delete(`/schedule/warehouse-shifts/${shift.id}`);
      setSuccess(`Đã xoá ca "${shift.name}".`);
      loadShifts(selectedWhId);
      setTimeout(() => setSuccess(""), 3000);
    } catch (ex) {
      setError(ex?.response?.data?.message || "Không thể xoá ca này.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const selectedWhName = warehouses.find(w => w.warehouseId === selectedWhId)?.warehouseName || "";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter','Segoe UI',sans-serif", color:C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"18px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>Quản lý ca làm</h1>
            <p style={{ margin:"3px 0 0", fontSize:12, color:C.sub }}>
              Tạo và quản lý các ca làm việc mẫu cho kho
            </p>
          </div>

          {/* Warehouse selector */}
          {warehouses.length > 1 && (
            <select
              value={selectedWhId ?? ""}
              onChange={e => setSelectedWhId(Number(e.target.value))}
              style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${C.border}`,
                fontSize:13, color:C.text, background:C.surface, cursor:"pointer", minWidth:180 }}
            >
              {warehouses.map(w => (
                <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>
              ))}
            </select>
          )}
          {warehouses.length === 1 && (
            <span style={{ fontSize:13, fontWeight:700, color:C.accent, background:C.accentBg,
              padding:"5px 12px", borderRadius:99 }}>
              {selectedWhName}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(320px,400px) 1fr", gap:24, padding:"28px", maxWidth:1100, margin:"0 auto" }}>

        {/* ── Create form ── */}
        <div>
          <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`,
            boxShadow:C.shadow, padding:"24px" }}>
            <div style={{ fontWeight:800, fontSize:16, color:C.text, marginBottom:20,
              display:"flex", alignItems:"center", gap:8 }}>
              <span className="material-symbols-outlined" style={{ fontSize:20, color:C.accent }}>add_circle</span>
              Thêm ca mới
            </div>

            {error && (
              <div style={{ padding:"10px 14px", background:"#fff1f2", color:"#dc2626",
                borderRadius:8, fontSize:12, marginBottom:14, border:"1px solid #fecaca",
                display:"flex", alignItems:"center", gap:6 }}>
                <span className="material-symbols-outlined" style={{ fontSize:14 }}>error</span>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding:"10px 14px", background:"#f0fdf4", color:"#15803d",
                borderRadius:8, fontSize:12, marginBottom:14, border:"1px solid #bbf7d0",
                display:"flex", alignItems:"center", gap:6 }}>
                <span className="material-symbols-outlined" style={{ fontSize:14 }}>check_circle</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Tên ca *</label>
                <input
                  type="text"
                  placeholder="Vd: Ca sáng, Ca chiều, Ca đêm..."
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={inp}
                  maxLength={100}
                />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                <div>
                  <label style={lbl}>Giờ vào *</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    style={inp} required />
                </div>
                <div>
                  <label style={lbl}>Giờ ra *</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    style={inp} required />
                </div>
              </div>

              {/* Preview */}
              {form.startTime && form.endTime && (
                <div style={{ marginBottom:18, padding:"10px 14px", borderRadius:8,
                  background:C.accentBg, border:`1px solid #c7d2fe` }}>
                  <div style={{ fontSize:12, color:C.accent, fontWeight:700 }}>Xem trước</div>
                  <div style={{ fontSize:14, color:C.text, fontWeight:800, marginTop:4 }}>
                    {form.name || "(chưa đặt tên)"} · {form.startTime} → {form.endTime}
                    {form.endTime < form.startTime && (
                      <span style={{ fontSize:11, color:"#f59e0b", marginLeft:6 }}>+1 ngày</span>
                    )}
                    {calcDuration(form.startTime, form.endTime) && (
                      <span style={{ fontSize:12, color:C.sub, marginLeft:8, fontWeight:500 }}>
                        ({calcDuration(form.startTime, form.endTime)})
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" disabled={saving}
                style={{
                  width:"100%", padding:"11px 0", borderRadius:9, border:"none",
                  background: saving ? "#a5b4fc" : C.accent, color:"#fff",
                  cursor: saving ? "not-allowed" : "pointer", fontSize:14, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  transition:"background .15s",
                }}>
                {saving
                  ? <><span className="material-symbols-outlined" style={{ fontSize:16, animation:"spin 1s linear infinite" }}>sync</span> Đang tạo...</>
                  : <><span className="material-symbols-outlined" style={{ fontSize:16 }}>add</span> Tạo ca</>
                }
              </button>
            </form>
          </div>

          {/* Tips */}
          <div style={{ marginTop:16, padding:"14px 16px", borderRadius:10,
            background:"#fefce8", border:"1px solid #fde68a" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#92400e", marginBottom:6,
              display:"flex", alignItems:"center", gap:5 }}>
              <span className="material-symbols-outlined" style={{ fontSize:14 }}>lightbulb</span>
              Lưu ý
            </div>
            <ul style={{ margin:0, padding:"0 0 0 16px", fontSize:11, color:"#78350f", lineHeight:1.8 }}>
              <li>Ca làm mẫu được dùng khi phân ca cho nhân viên.</li>
              <li>Giờ ra nhỏ hơn giờ vào = ca qua đêm (+1 ngày).</li>
              <li>Chỉ Điều phối viên (OPERATOR) mới có quyền tạo ca.</li>
            </ul>
          </div>
        </div>

        {/* ── Shift list ── */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:C.text }}>
                Danh sách ca
              </div>
              <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>
                {loading ? "Đang tải..." : `${shifts.length} ca làm được cài đặt`}
              </div>
            </div>
            <button onClick={() => loadShifts(selectedWhId)}
              disabled={loading}
              style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${C.border}`,
                background:C.surface, color:C.sub, cursor:"pointer", fontSize:12,
                display:"flex", alignItems:"center", gap:5, fontWeight:600 }}>
              <span className="material-symbols-outlined" style={{ fontSize:15 }}>refresh</span>
              Làm mới
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:C.subLight, fontSize:13 }}>
              Đang tải danh sách ca...
            </div>
          ) : shifts.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", background:C.surface,
              borderRadius:14, border:`1px solid ${C.border}`, color:C.subLight }}>
              <span className="material-symbols-outlined" style={{ fontSize:48, marginBottom:12, display:"block", opacity:.4 }}>schedule_off</span>
              <div style={{ fontSize:14, fontWeight:600 }}>Chưa có ca làm nào</div>
              <div style={{ fontSize:12, marginTop:4 }}>Tạo ca đầu tiên bằng form bên trái.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {shifts.map(s => (
                <ShiftCard key={s.id} shift={s} onDelete={setDeleteTarget} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm delete modal ── */}
      {deleteTarget && (
        <ConfirmModal
          shift={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
