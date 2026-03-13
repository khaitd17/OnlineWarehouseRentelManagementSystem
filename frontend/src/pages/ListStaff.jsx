import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import staffService from "../services/staffService";
import { getMyWarehouses } from "../services/warehouseService";

/* ─── Palette ─── */
const C = {
  bg: "#0f1117", surface: "#1a1d27", card: "#20232e", border: "#2a2d3d",
  accent: "#6366f1", accentHover: "#818cf8",
  green: "#22c55e", greenBg: "rgba(34,197,94,.12)",
  red: "#ef4444",   redBg: "rgba(239,68,68,.12)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,.12)",
  text: "#e2e8f0",  sub: "#94a3b8", chip: "#2d3148",
  overlay: "rgba(0,0,0,.7)",
};

const roleColor = {
  OWNER:    { bg: "rgba(99,102,241,.18)", color: "#818cf8" },
  MANAGER:  { bg: "rgba(245,158,11,.18)", color: "#fbbf24" },
  OPERATOR: { bg: "rgba(34,197,94,.18)",  color: "#4ade80" },
  STAFF:    { bg: "rgba(148,163,184,.18)", color: "#94a3b8" },
};

function Chip({ label, color = C.sub, bg = C.chip, onClick, active }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-block", padding: "2px 10px",
        borderRadius: 999, fontSize: 11, fontWeight: 600,
        background: active ? (bg || C.chip) : (active === undefined ? bg : C.chip),
        color: active === undefined ? color : (active ? color : C.sub),
        marginRight: 4, marginBottom: 4, letterSpacing: ".4px",
        textTransform: "uppercase",
        cursor: onClick ? "pointer" : "default",
        border: active !== undefined ? `1.5px solid ${active ? color : C.border}` : "none",
        transition: "all .15s",
      }}
    >{label}</span>
  );
}

function RoleBadge({ code, name }) {
  const { bg, color } = roleColor[code] ?? { bg: C.chip, color: C.sub };
  return <Chip label={name || code} bg={bg} color={color} />;
}

function StatusDot({ active }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: active ? C.green : C.red, marginRight: 6,
      boxShadow: `0 0 6px ${active ? C.green : C.red}`,
    }} />
  );
}

// ── Reassign Modal ────────────────────────────────────────────────────────────
function ReassignModal({ staff, warehouseId, callerMembership, warehouseOptions, onClose, onSuccess }) {
  const isOperator = callerMembership?.roleCode === "OPERATOR";

  // Giới hạn skill/zone dựa theo quyền caller
  const availableSkills = isOperator
    ? warehouseOptions.skills
    : warehouseOptions.skills.filter(s => callerMembership?.skillIds?.includes(s.id));

  const availableZones = isOperator
    ? warehouseOptions.zones
    : warehouseOptions.zones.filter(z => callerMembership?.zoneIds?.includes(z.id));

  const [form, setForm] = useState({
    targetRoleCode: staff.roleCode === "MANAGER" || staff.roleCode === "STAFF" ? staff.roleCode : "STAFF",
    skillIds: staff.skills?.map(s => s.id).filter(Boolean) ?? [],
    zoneIds:  staff.zones?.map(z => z.id).filter(Boolean) ?? [],
    isAllSkill: staff.isAllSkill || false,
    isAllZone:  staff.isAllZone  || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const toggleArr = (field, id) =>
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter(x => x !== id)
        : [...prev[field], id],
    }));

  const handleSubmit = async () => {
    setError("");
    setSaving(true);
    try {
      await staffService.reassignMembership({
        targetMembershipId: staff.membershipId,
        targetRoleCode:     form.targetRoleCode,
        skillIds:           form.isAllSkill ? [] : form.skillIds,
        zoneIds:            form.isAllZone  ? [] : form.zoneIds,
        isAllSkill:         form.isAllSkill,
        isAllZone:          form.isAllZone,
      });
      onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const ms = {
    overlay: {
      position: "fixed", inset: 0, background: C.overlay, zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    box: {
      background: C.surface, borderRadius: 16, padding: "28px 32px",
      width: "100%", maxWidth: 520, border: `1px solid ${C.border}`,
      maxHeight: "90vh", overflowY: "auto",
    },
    title: { fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 },
    sub:   { fontSize: 13, color: C.sub, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6, display: "block" },
    roleTab: { display: "flex", gap: 8, marginBottom: 20 },
    tabBtn: (active) => ({
      padding: "8px 18px", borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: "pointer",
      background: active ? C.accent : "transparent",
      color:      active ? "#fff"   : C.sub,
      border:     `1.5px solid ${active ? C.accent : C.border}`,
      transition: "all .15s",
    }),
    chipsArea: {
      display: "flex", flexWrap: "wrap", padding: "10px 12px",
      border: `1.5px solid ${C.border}`, borderRadius: 10,
      minHeight: 44, marginBottom: 6, background: C.card,
    },
    checkRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: C.text },
    actions: { display: "flex", gap: 10, marginTop: 24 },
    saveBtn: {
      flex: 1, padding: "10px 0", background: C.accent, color: "#fff",
      border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14,
    },
    cancelBtn: {
      flex: 1, padding: "10px 0", background: "transparent", color: C.sub,
      border: `1px solid ${C.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14,
    },
    err: {
      background: C.redBg, color: C.red, border: `1px solid ${C.red}`,
      borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16,
    },
  };

  return (
    <div style={ms.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={ms.box}>
        <div style={ms.title}>⚙️ Phân quyền lại</div>
        <div style={ms.sub}>{staff.fullName} — {staff.email}</div>

        {error && <div style={ms.err}>{error}</div>}

        {/* Role */}
        <label style={ms.label}>Role trong kho</label>
        {isOperator ? (
          <div style={ms.roleTab}>
            {["STAFF", "MANAGER"].map(r => (
              <button key={r} type="button"
                style={ms.tabBtn(form.targetRoleCode === r)}
                onClick={() => setForm(f => ({ ...f, targetRoleCode: r, skillIds: [], zoneIds: [], isAllSkill: false, isAllZone: false }))}>
                {r === "STAFF" ? "👷 Nhân viên (STAFF)" : "🗂 Quản lý (MANAGER)"}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 20, padding: "8px 14px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, color: C.text, fontSize: 13 }}>
            👷 Nhân viên (STAFF)
            <span style={{ color: C.sub, fontSize: 11, marginLeft: 8 }}>— Manager chỉ phân quyền cấp STAFF</span>
          </div>
        )}

        {/* Skills */}
        <label style={ms.label}>Bộ phận phụ trách</label>
        {isOperator && (
          <label style={ms.checkRow}>
            <input type="checkbox" checked={form.isAllSkill}
              onChange={e => setForm(f => ({ ...f, isAllSkill: e.target.checked, skillIds: [] }))} />
            Tất cả bộ phận
          </label>
        )}
        {!form.isAllSkill && (
          <div style={ms.chipsArea}>
            {availableSkills.length === 0
              ? <span style={{ fontSize: 12, color: C.sub }}>Không có skill</span>
              : availableSkills.map(s => (
                  <Chip key={s.id} label={s.name || s.code} active={form.skillIds.includes(s.id)}
                    color="#818cf8" bg="rgba(99,102,241,.18)"
                    onClick={() => toggleArr("skillIds", s.id)} />
                ))
            }
          </div>
        )}

        {/* Zones */}
        <label style={{ ...ms.label, marginTop: 12 }}>Khu vực phụ trách</label>
        {isOperator && (
          <label style={ms.checkRow}>
            <input type="checkbox" checked={form.isAllZone}
              onChange={e => setForm(f => ({ ...f, isAllZone: e.target.checked, zoneIds: [] }))} />
            Tất cả khu vực
          </label>
        )}
        {!form.isAllZone && (
          <div style={ms.chipsArea}>
            {availableZones.length === 0
              ? <span style={{ fontSize: 12, color: C.sub }}>Không có zone</span>
              : availableZones.map(z => (
                  <Chip key={z.id} label={z.name || z.code} active={form.zoneIds.includes(z.id)}
                    color={C.green} bg={C.greenBg}
                    onClick={() => toggleArr("zoneIds", z.id)} />
                ))
            }
          </div>
        )}

        <div style={ms.actions}>
          <button style={ms.cancelBtn} onClick={onClose}>Hủy</button>
          <button style={{ ...ms.saveBtn, opacity: saving ? .7 : 1 }}
            disabled={saving} onClick={handleSubmit}>
            {saving ? "Đang lưu..." : "✅ Lưu phân quyền"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── StaffCard ─────────────────────────────────────────────────────────────────
function StaffCard({ staff, warehouseId, callerMembership, warehouseOptions, onRefresh }) {
  const isActive = staff.membershipIsActive;
  const [busy, setBusy]             = useState(false);
  const [showReassign, setReassign] = useState(false);

  const handleToggle = async () => {
    if (!window.confirm(
      isActive ? `Deactivate ${staff.fullName}?` : `Activate lại ${staff.fullName}?`
    )) return;
    setBusy(true);
    try {
      if (isActive) await staffService.deactivateMembership(staff.membershipId);
      else          await staffService.activateMembership(staff.membershipId);
      onRefresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Thao tác thất bại.");
    } finally { setBusy(false); }
  };

  // OPERATOR và MANAGER có thể reassign (nếu đây không phải chính mình)
  const canReassign = callerMembership &&
    (callerMembership.roleCode === "OPERATOR" || callerMembership.roleCode === "MANAGER") &&
    staff.roleCode !== "OPERATOR";

  return (
    <>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 18,
        borderLeft: `3px solid ${isActive ? C.accent : C.border}`,
      }}>
        {/* Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${C.accent}, #a855f7)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 700, color: "#fff",
        }}>
          {staff.fullName?.[0]?.toUpperCase() ?? "?"}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{staff.fullName}</span>
            <RoleBadge code={staff.roleCode} name={staff.roleName} />
            <span style={{ fontSize: 12, color: isActive ? C.green : C.sub }}>
              <StatusDot active={isActive} />{isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div style={{ fontSize: 13, color: C.sub, marginBottom: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>✉ {staff.email}</span>
            {staff.phone && <span>📞 {staff.phone}</span>}
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: ".6px", marginRight: 6 }}>Bộ phận</span>
            {staff.isAllSkill
              ? <Chip label="Tất cả bộ phận" bg="rgba(99,102,241,.18)" color={C.accentHover} />
              : staff.skills?.length > 0
                ? staff.skills.map(s => <Chip key={s.code} label={s.name || s.code} />)
                : <span style={{ fontSize: 12, color: C.sub }}>—</span>
            }
          </div>

          {/* Zones */}
          <div>
            <span style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: ".6px", marginRight: 6 }}>Khu vực</span>
            {staff.isAllZone
              ? <Chip label="Tất cả khu vực" bg={C.greenBg} color={C.green} />
              : staff.zones?.length > 0
                ? staff.zones.map(z => <Chip key={z.code} label={z.code} bg={C.greenBg} color={C.green} />)
                : <span style={{ fontSize: 12, color: C.sub }}>—</span>
            }
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {canReassign && (
            <button
              onClick={() => setReassign(true)}
              style={{
                padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.amber}`,
                background: C.amberBg, color: C.amber,
                cursor: "pointer", fontSize: 12, fontWeight: 700,
              }}
            >⚙️ Phân quyền</button>
          )}
          <button
            onClick={handleToggle} disabled={busy}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "none",
              background: isActive ? C.redBg : C.greenBg,
              color: isActive ? C.red : C.green,
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 700, opacity: busy ? .6 : 1,
            }}
          >
            {busy ? "..." : isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {showReassign && (
        <ReassignModal
          staff={staff}
          warehouseId={warehouseId}
          callerMembership={callerMembership}
          warehouseOptions={warehouseOptions}
          onClose={() => setReassign(false)}
          onSuccess={() => { setReassign(false); onRefresh(); }}
        />
      )}
    </>
  );
}

// ── Main ListStaff Page ───────────────────────────────────────────────────────
export default function ListStaff() {
  const [searchParams] = useSearchParams();
  const warehouseIdParam = searchParams.get("warehouseId");
  const navigate = useNavigate();

  const [warehouses, setWarehouses]             = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouseIdParam || "");
  const [search, setSearch]                     = useState("");
  const [staffData, setStaffData]               = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [page, setPage]                         = useState(1);
  const PAGE_SIZE = 20;

  // Caller membership và options của kho hiện tại (dùng cho modal Reassign)
  const [callerMembership, setCallerMembership] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState({ skills: [], zones: [] });

  useEffect(() => {
    getMyWarehouses()
      .then(d => {
        setWarehouses(d || []);
        if (!selectedWarehouse && d?.length > 0)
          setSelectedWarehouse(String(d[0].warehouseId));
      })
      .catch(console.error);
  }, []);

  // Khi chọn kho: tải membership của caller và options (skill/zone)
  useEffect(() => {
    if (!selectedWarehouse) { setCallerMembership(null); return; }
    Promise.all([
      staffService.getMyMembership(parseInt(selectedWarehouse)),
      staffService.getWarehouseOptions(parseInt(selectedWarehouse)),
    ]).then(([membership, options]) => {
      setCallerMembership(membership);
      setWarehouseOptions(options);
    }).catch(console.error);
  }, [selectedWarehouse]);

  const fetchStaff = useCallback(async (p = 1) => {
    if (!selectedWarehouse) return;
    setLoading(true); setError(null);
    try {
      const data = await staffService.listStaff(selectedWarehouse, p, PAGE_SIZE, search);
      setStaffData(data); setPage(p);
    } catch (e) {
      setError(e?.response?.data?.message || "Lấy danh sách nhân viên thất bại.");
    } finally { setLoading(false); }
  }, [selectedWarehouse, search]);

  useEffect(() => { fetchStaff(1); }, [selectedWarehouse]);

  const warehouseName = warehouses.find(w => String(w.warehouseId) === String(selectedWarehouse))?.name;

  /* ── styles ── */
  const s = {
    page: { minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Inter', sans-serif", color: C.text },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    title: { margin: 0, fontSize: 22, fontWeight: 700 },
    addBtn: { padding: "9px 20px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 },
    bar: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" },
    select: { padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, minWidth: 200 },
    input: { padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, flex: 1, minWidth: 220 },
    searchBtn: { padding: "9px 18px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 },
    grid: { display: "flex", flexDirection: "column", gap: 14 },
    pager: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 },
    pageBtn: (disabled) => ({ padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: disabled ? C.sub : C.text, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13 }),
  };

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={s.header}>
        <div>
          <h2 style={s.title}>Nhân viên kho</h2>
          {warehouseName && (
            <p style={{ margin: "4px 0 0", color: C.sub, fontSize: 13 }}>
              📦 {warehouseName} · {staffData?.total ?? "—"} nhân viên
              {callerMembership && (
                <span style={{ marginLeft: 12, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: "rgba(99,102,241,.15)", color: C.accentHover }}>
                  {callerMembership.roleCode}
                </span>
              )}
            </p>
          )}
        </div>
        <button onClick={() => navigate("/create-staff")} style={s.addBtn}>+ Thêm nhân viên</button>
      </div>

      {/* Filter bar */}
      <div style={s.bar}>
        <select value={selectedWarehouse} onChange={e => { setSelectedWarehouse(e.target.value); setPage(1); }} style={s.select}>
          <option value="">-- Chọn kho --</option>
          {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
        </select>
        <input style={s.input} placeholder="Tìm theo tên hoặc email..." value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchStaff(1)} />
        <button onClick={() => fetchStaff(1)} style={s.searchBtn}>Tìm kiếm</button>
      </div>

      {error && (
        <div style={{ background: C.redBg, border: `1px solid ${C.red}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: C.red }}>
          {error}
        </div>
      )}

      {!selectedWarehouse && !loading && (
        <div style={{ textAlign: "center", padding: 40, color: C.sub }}>Chọn kho để xem danh sách nhân viên.</div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: C.sub }}>Đang tải...</div>}

      {!loading && staffData && (
        <>
          {staffData.items?.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.sub }}>Kho này chưa có nhân viên nào.</div>
          ) : (
            <div style={s.grid}>
              {staffData.items.map(staff => (
                <StaffCard
                  key={staff.membershipId}
                  staff={staff}
                  warehouseId={parseInt(selectedWarehouse)}
                  callerMembership={callerMembership}
                  warehouseOptions={warehouseOptions}
                  onRefresh={() => fetchStaff(page)}
                />
              ))}
            </div>
          )}

          {staffData.totalPages > 1 && (
            <div style={s.pager}>
              <button style={s.pageBtn(page <= 1)} disabled={page <= 1} onClick={() => fetchStaff(page - 1)}>← Trang trước</button>
              <span style={{ color: C.sub, fontSize: 13 }}>Trang {page} / {staffData.totalPages}</span>
              <button style={s.pageBtn(page >= staffData.totalPages)} disabled={page >= staffData.totalPages} onClick={() => fetchStaff(page + 1)}>Trang sau →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
