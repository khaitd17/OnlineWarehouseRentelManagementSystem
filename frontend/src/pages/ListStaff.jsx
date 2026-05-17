import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import staffService from "../services/staffService";
import axiosClient from "../services/axiosClient";

/* ─── Light Palette ─────────────────────────────────────────────────────── */
const C = {
  bg:       "#f1f5f9",
  surface:  "#ffffff",
  card:     "#ffffff",
  cardHo:   "#f8faff",
  border:   "#e2e8f0",
  accent:   "#6366f1",
  accentH:  "#4f46e5",
  green:    "#16a34a",   greenBg:  "#f0fdf4",
  red:      "#dc2626",   redBg:    "#fff1f2",
  amber:    "#d97706",   amberBg:  "#fffbeb",
  text:     "#0f172a",
  sub:      "#64748b",
  subL:     "#94a3b8",
  shadow:   "0 1px 3px rgba(0,0,0,.08)",
  shadowM:  "0 4px 12px rgba(0,0,0,.1)",
  overlay:  "rgba(15,23,42,.4)",
};

const ROLE_COLORS = {
  OWNER:    { bg:"#eff0ff", color:"#4f46e5" },
  MANAGER:  { bg:"#fffbeb", color:"#d97706" },
  OPERATOR: { bg:"#f0fdf4", color:"#16a34a" },
  STAFF:    { bg:"#f1f5f9", color:"#64748b" },
};

/* ─── Small Components ──────────────────────────────────────────────────── */
function RoleBadge({ code, name }) {
  const s = ROLE_COLORS[code] ?? { bg:"#f1f5f9", color:"#64748b" };
  return (
    <span style={{
      display:"inline-block", padding:"2px 9px", borderRadius:999,
      fontSize:10, fontWeight:700, letterSpacing:".4px", textTransform:"uppercase",
      background:s.bg, color:s.color,
    }}>{name || code}</span>
  );
}

function StatusDot({ active }) {
  return (
    <span style={{
      display:"inline-block", width:7, height:7, borderRadius:"50%",
      background: active ? C.green : C.red, marginRight:5,
      boxShadow:`0 0 4px ${active ? C.green : C.red}`,
    }} />
  );
}

function Chip({ label, color = C.sub, bg = "#f1f5f9", onClick, active }) {
  return (
    <span onClick={onClick} style={{
      display:"inline-block", padding:"2px 9px", borderRadius:999,
      fontSize:10, fontWeight:600, background: active === undefined ? bg : (active ? bg : "#f1f5f9"),
      color: active === undefined ? color : (active ? color : C.subL),
      marginRight:4, marginBottom:4, letterSpacing:".3px", textTransform:"uppercase",
      cursor: onClick ? "pointer" : "default",
      border: active !== undefined ? `1.5px solid ${active ? color : C.border}` : "none",
      transition:"all .15s",
    }}>{label}</span>
  );
}

/* ─── Confirm Toggle Modal ─────────────────────────────────────────────── */
function ConfirmToggleModal({ staff, isActive, onConfirm, onClose, busy }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:C.overlay, zIndex:1000,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, borderRadius:14, padding:"24px 28px",
        width:"100%", maxWidth:400, border:`1px solid ${C.border}`, boxShadow:C.shadowM }}>
        <div style={{ fontSize:20, marginBottom:10, textAlign:"center" }}>
          {isActive ? "⚠️" : "✅"}
        </div>
        <div style={{ fontWeight:700, fontSize:15, color:C.text, textAlign:"center", marginBottom:6 }}>
          {isActive ? "Vô hiệu hóa nhân viên?" : "Kích hoạt lại nhân viên?"}
        </div>
        <div style={{ fontSize:12, color:C.sub, textAlign:"center", marginBottom:22, lineHeight:1.6 }}>
          {isActive
            ? <><strong>{staff.fullName}</strong> sẽ không còn được nhận ca làm việc hay task mới trong kho này.</>
            : <><strong>{staff.fullName}</strong> sẽ được kích hoạt lại và có thể nhận ca/task trong kho.</>}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} disabled={busy}
            style={{ flex:1, padding:"9px 0", borderRadius:10, border:`1px solid ${C.border}`,
              background:"transparent", color:C.sub, fontWeight:600, cursor:"pointer", fontSize:13 }}>
            Hủy
          </button>
          <button onClick={onConfirm} disabled={busy}
            style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none",
              background: isActive ? C.red : C.green,
              color:"#fff", fontWeight:700, cursor:busy?"not-allowed":"pointer",
              fontSize:13, opacity:busy?.7:1 }}>
            {busy ? "Đang xử lý..." : isActive ? "Vô hiệu hóa" : "Kích hoạt"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Reassign Modal ────────────────────────────────────────────────────── */
const ROLE_TYPES = [
  { code:"CHECKER",            label:"Checker",            desc:"Nhận hàng & Xuất hàng (Inbound / Outbound)", color:"#4f46e5", bg:"#eff0ff" },
  { code:"INVENTORY_OPERATOR", label:"Inventory Operator", desc:"Sắp xếp vị trí & Xử lý kiểm kê",            color:"#0369a1", bg:"#e0f2fe" },
  { code:"WAREHOUSE_WORKER",   label:"Warehouse Worker",   desc:"Nhân viên phổ thông — quản lý ca (Shift)",   color:"#15803d", bg:"#dcfce7" },
];

function ReassignModal({ staff, warehouseId, callerMembership, warehouseOptions, onClose, onSuccess }) {
  // Check từ warehouseContext.roles[] để hỗ trợ OWNER+OPERATOR
  const ctx = JSON.parse(localStorage.getItem("warehouseContext") || "{}");
  const warehouseEntry = (ctx.warehouses || []).find(w => w.warehouseId === warehouseId);
  const callerRoles = new Set(
    (warehouseEntry?.roles?.length ? warehouseEntry.roles : [warehouseEntry?.role || ""])
      .map(r => r.toUpperCase())
  );
  const isOperator = callerRoles.has("OPERATOR") || callerMembership?.roleCode === "OPERATOR";

  // Determine current skill code from staff's skills list
  const currentSkillCode = staff.skills?.find(s => ROLE_TYPES.some(r => r.code === s.code))?.code ?? null;

  const [form, setForm] = useState({
    targetRoleCode: staff.roleCode === "MANAGER" || staff.roleCode === "STAFF" ? staff.roleCode : "STAFF",
    skillIds: staff.skills?.map(s => s.id).filter(Boolean) ?? [],
    isAllSkill: false,
    selectedSkillCode: currentSkillCode,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const getSkillIdByCode = (code) => warehouseOptions.skills?.find(s => s.code === code)?.id ?? null;

  const selectRoleType = (code) => {
    const id = getSkillIdByCode(code);
    setForm(f => ({ ...f, selectedSkillCode: code, skillIds: id ? [id] : [], isAllSkill: false }));
  };

  const handleSubmit = async () => {
    setError(""); setSaving(true);
    try {
      await staffService.reassignMembership({
        targetMembershipId: staff.membershipId,
        targetRoleCode: form.targetRoleCode,
        skillIds:  form.skillIds,
        isAllSkill: false,
      });
      onSuccess();
    } catch(e) {
      setError(e?.response?.data?.message || "Cập nhật thất bại.");
    } finally { setSaving(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:C.overlay, zIndex:999,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:C.surface, borderRadius:16, padding:"24px 28px",
        width:"100%", maxWidth:520, border:`1px solid ${C.border}`,
        maxHeight:"90vh", overflowY:"auto", boxShadow:C.shadowM }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:3 }}>Phân quyền lại</div>
        <div style={{ fontSize:12, color:C.sub, marginBottom:18 }}>{staff.fullName} — {staff.email}</div>

        {error && <div style={{ background:C.redBg, color:C.red, border:`1px solid ${C.red}`,
          borderRadius:8, padding:"9px 13px", fontSize:12, marginBottom:14 }}>{error}</div>}

        {/* Role */}
        <label style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:"uppercase",
          letterSpacing:".6px", marginBottom:8, display:"block" }}>Role trong kho</label>
        {isOperator ? (
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {["STAFF","MANAGER"].map(r => (
              <button key={r} type="button"
                onClick={() => setForm(f => ({ ...f, targetRoleCode: r, skillIds: [], selectedSkillCode: null, isAllSkill: false }))}
                style={{ padding:"7px 16px", borderRadius:20, fontWeight:600, fontSize:12, cursor:"pointer",
                  background: form.targetRoleCode === r ? C.accent : "transparent",
                  color:      form.targetRoleCode === r ? "#fff"   : C.sub,
                  border:    `1.5px solid ${form.targetRoleCode === r ? C.accent : C.border}`,
                  transition:"all .15s" }}>
                {r === "STAFF" ? "Nhân viên" : "Quản lý"}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom:18, padding:"8px 13px", background:C.card,
            borderRadius:8, border:`1px solid ${C.border}`, color:C.text, fontSize:12 }}>
            Nhân viên (STAFF)
            <span style={{ color:C.sub, fontSize:11, marginLeft:8 }}>— Manager chỉ phân quyền cấp STAFF</span>
          </div>
        )}

        {/* Loại nhân viên — 3 chip cố định */}
        <label style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:"uppercase",
          letterSpacing:".6px", marginBottom:8, display:"block" }}>Loại nhân viên</label>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {ROLE_TYPES.map(rt => {
            const active = form.selectedSkillCode === rt.code;
            return (
              <div key={rt.code} onClick={() => selectRoleType(rt.code)} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                borderRadius:10, cursor:"pointer",
                border:`1.5px solid ${active ? rt.color : C.border}`,
                background: active ? rt.bg : C.card, transition:"all .15s",
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:12, color: active ? rt.color : C.text }}>{rt.label}</div>
                  <div style={{ fontSize:11, color:C.sub }}>{rt.desc}</div>
                </div>
                {active && <span style={{ fontSize:13, fontWeight:700, color:rt.color }}>OK</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:"9px 0", background:"transparent", color:C.sub,
              border:`1px solid ${C.border}`, borderRadius:10, fontWeight:600, cursor:"pointer", fontSize:13 }}>
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex:1, padding:"9px 0", background:C.accent, color:"#fff",
              border:"none", borderRadius:10, fontWeight:700, cursor:saving?"not-allowed":"pointer",
              fontSize:13, opacity:saving?.7:1 }}>
            {saving ? "Đang lưu..." : "Lưu phân quyền"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ─── Staff Card ────────────────────────────────────────────────────────── */
function StaffCard({ staff, warehouseId, callerMembership, warehouseOptions, onRefresh }) {
  const isActive = staff.membershipIsActive;
  const [busy, setBusy]             = useState(false);
  const [showReassign, setReassign]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    try {
      if (isActive) await staffService.deactivateMembership(staff.membershipId);
      else          await staffService.activateMembership(staff.membershipId);
      setShowConfirm(false);
      onRefresh();
    } catch(e) { alert(e?.response?.data?.message || "Thao tác thất bại."); }
    finally { setBusy(false); }
  };

  // Lấy tất cả roles của caller trong kho này từ warehouseContext (bao gồm cả OPERATOR nếu là OWNER+OPERATOR)
  const ctx = JSON.parse(localStorage.getItem("warehouseContext") || "{}");
  const currentUserId = ctx.userId ?? -1;  // ID người dùng hiện tại — dùng để ẩn nút vô hiệu hóa cho bản thân
  const warehouseEntry = (ctx.warehouses || []).find(w => w.warehouseId === (warehouseId || parseInt(warehouseId)));
  const callerRoles = new Set(
    (warehouseEntry?.roles?.length ? warehouseEntry.roles : [warehouseEntry?.role || ""])
      .map(r => r.toUpperCase())
  );

  const isSelf      = staff.userId === currentUserId;   // true nếu thẻ này là chính mình
  const canReassign = callerMembership &&
    (callerRoles.has("OPERATOR") || callerRoles.has("MANAGER")) &&
    staff.roleCode !== "OPERATOR" &&
    !isSelf;

  return (
    <>
      <div style={{
        background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
        padding:"16px 18px", display:"flex", alignItems:"flex-start", gap:14,
        borderLeft:`3px solid ${isActive ? C.accent : C.border}`,
        boxShadow:C.shadow, transition:"box-shadow .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = C.shadowM}
        onMouseLeave={e => e.currentTarget.style.boxShadow = C.shadow}
      >
        {/* Avatar */}
        <div style={{
          width:42, height:42, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg, ${C.accent}, #a855f7)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, fontWeight:700, color:"#fff",
        }}>
          {staff.fullName?.[0]?.toUpperCase() ?? "?"}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{staff.fullName}</span>
            <RoleBadge code={staff.roleCode} name={staff.roleName} />
            <span style={{ fontSize:11, color: isActive ? C.green : C.sub }}>
              <StatusDot active={isActive} />{isActive ? "Hoạt động" : "Không hoạt động"}
            </span>
          </div>

          <div style={{ fontSize:12, color:C.sub, marginBottom:10, display:"flex", gap:14, flexWrap:"wrap" }}>
            <span>{staff.email}</span>
            {staff.phone && <span>{staff.phone}</span>}
          </div>

          <div>
            <span style={{ fontSize:10, color:C.subL, textTransform:"uppercase", letterSpacing:".5px", marginRight:6 }}>Bộ phận</span>
            {staff.isAllSkill
              ? <Chip label="Tất cả bộ phận" bg="#eff0ff" color="#4f46e5" />
              : staff.skills?.length > 0
                ? staff.skills.map(s => <Chip key={s.code} label={s.name||s.code} />)
                : <span style={{ fontSize:11, color:C.subL }}>—</span>
            }
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
          {canReassign && (
            <button onClick={() => setReassign(true)}
              style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${C.amber}`,
                background:C.amberBg, color:C.amber, cursor:"pointer", fontSize:11, fontWeight:700 }}>
              Phân quyền
            </button>
          )}
          {staff.roleCode !== "OWNER" && !isSelf && (
            <button onClick={() => setShowConfirm(true)} disabled={busy}
              style={{ padding:"6px 12px", borderRadius:8, border:"none",
                background: isActive ? C.redBg : C.greenBg,
                color: isActive ? C.red : C.green,
                cursor: busy ? "not-allowed" : "pointer", fontSize:11, fontWeight:700, opacity:busy?.6:1 }}>
              {busy ? "..." : isActive ? "Vô hiệu hoá" : "Kích hoạt"}
            </button>
          )}
        </div>
      </div>

      {showReassign && (
        <ReassignModal staff={staff} warehouseId={warehouseId}
          callerMembership={callerMembership} warehouseOptions={warehouseOptions}
          onClose={() => setReassign(false)}
          onSuccess={() => { setReassign(false); onRefresh(); }} />
      )}
      {showConfirm && (
        <ConfirmToggleModal
          staff={staff}
          isActive={isActive}
          busy={busy}
          onConfirm={handleToggle}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function ListStaff() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const warehouseIdParam = searchParams.get("warehouseId");

  const [warehouses,         setWarehouses]         = useState([]);
  const [selectedWarehouse,  setSelectedWarehouse]  = useState(warehouseIdParam || "");
  const [search,             setSearch]             = useState("");
  const [staffData,          setStaffData]          = useState(null);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState(null);
  const [page,               setPage]               = useState(1);
  const [callerMembership,   setCallerMembership]   = useState(null);
  const [warehouseOptions,   setWarehouseOptions]   = useState({ skills:[] });
  const PAGE_SIZE = 20;

  useEffect(() => {
    axiosClient.get("/staff/my-warehouses").then(d => {
      setWarehouses(d.data || []);
      if (!selectedWarehouse && d.data?.length > 0) setSelectedWarehouse(String(d.data[0].warehouseId));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedWarehouse) { setCallerMembership(null); return; }
    Promise.all([
      staffService.getMyMembership(parseInt(selectedWarehouse)),
      staffService.getWarehouseOptions(parseInt(selectedWarehouse)),
    ]).then(([m, o]) => { setCallerMembership(m); setWarehouseOptions(o); }).catch(console.error);
  }, [selectedWarehouse]);

  const fetchStaff = useCallback(async (p = 1) => {
    if (!selectedWarehouse) return;
    setLoading(true); setError(null);
    try {
      const data = await staffService.listStaff(selectedWarehouse, p, PAGE_SIZE, search);
      setStaffData(data); setPage(p);
    } catch(e) {
      setError(e?.response?.data?.message || "Lấy danh sách nhân viên thất bại.");
    } finally { setLoading(false); }
  }, [selectedWarehouse, search]);

  useEffect(() => { fetchStaff(1); }, [selectedWarehouse]);

  const warehouseName = warehouses.find(w => String(w.warehouseId) === String(selectedWarehouse))?.warehouseName;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter','Segoe UI',sans-serif", color:C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`,
        padding:"16px 28px", display:"flex", justifyContent:"space-between",
        alignItems:"center", boxShadow:C.shadow }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:C.text }}>Nhân viên kho</h2>
          {warehouseName && (
            <p style={{ margin:"3px 0 0", color:C.sub, fontSize:12 }}>
              {warehouseName} · {staffData?.total ?? "—"} nhân viên
              {callerMembership && (
                <span style={{ marginLeft:10, padding:"2px 8px", borderRadius:12,
                  fontSize:10, fontWeight:700, background:"#eff0ff", color:C.accentH }}>
                  {callerMembership.roleCode}
                </span>
              )}
            </p>
          )}
        </div>
        <button onClick={() => navigate("/create-staff")}
          style={{ padding:"9px 20px", borderRadius:10, border:"none",
            background:C.accent, color:"#fff", fontWeight:700,
            cursor:"pointer", fontSize:13, boxShadow:"0 2px 8px rgba(99,102,241,.3)" }}>
          + Thêm nhân viên
        </button>
      </div>

      <div style={{ padding:"20px 28px" }}>
        {/* Filter bar */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
          <select value={selectedWarehouse}
            onChange={e => { setSelectedWarehouse(e.target.value); setPage(1); }}
            style={{ padding:"9px 12px", borderRadius:10, border:`1px solid ${C.border}`,
              background:C.surface, color:C.text, fontSize:13, minWidth:200, boxShadow:C.shadow }}>
            <option value="">-- Chọn kho --</option>
            {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
          </select>
          <input style={{ padding:"9px 12px", borderRadius:10, border:`1px solid ${C.border}`,
            background:C.surface, color:C.text, fontSize:13, flex:1, minWidth:220, boxShadow:C.shadow }}
            placeholder="Tìm theo tên hoặc email..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchStaff(1)} />
          <button onClick={() => fetchStaff(1)}
            style={{ padding:"9px 18px", borderRadius:10, border:"none",
              background:C.accent, color:"#fff", fontWeight:600,
              cursor:"pointer", fontSize:13 }}>
            Tìm kiếm
          </button>
        </div>

        {error && (
          <div style={{ background:C.redBg, border:`1px solid ${C.red}`, borderRadius:10,
            padding:"11px 16px", marginBottom:18, color:C.red, fontSize:13 }}>
            {error}
          </div>
        )}

        {!selectedWarehouse && !loading && (
          <div style={{ textAlign:"center", padding:48, color:C.subL, fontSize:13 }}>
            Chọn kho để xem danh sách nhân viên.
          </div>
        )}

        {loading && (
          <div style={{ textAlign:"center", padding:48, color:C.subL, fontSize:13 }}>Đang tải...</div>
        )}

        {!loading && staffData && (
          <>
            {staffData.items?.length === 0 ? (
              <div style={{ textAlign:"center", padding:48, color:C.subL, fontSize:13 }}>
                Kho này chưa có nhân viên nào.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {staffData.items.map(staff => (
                  <StaffCard key={staff.membershipId} staff={staff}
                    warehouseId={parseInt(selectedWarehouse)}
                    callerMembership={callerMembership}
                    warehouseOptions={warehouseOptions}
                    onRefresh={() => fetchStaff(page)} />
                ))}
              </div>
            )}

            {staffData.totalPages > 1 && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:22 }}>
                <button disabled={page <= 1} onClick={() => fetchStaff(page-1)}
                  style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${C.border}`,
                    background:C.surface, color: page<=1 ? C.subL : C.text,
                    cursor: page<=1 ? "not-allowed" : "pointer", fontSize:12 }}>
                  ← Trang trước
                </button>
                <span style={{ color:C.sub, fontSize:12 }}>Trang {page} / {staffData.totalPages}</span>
                <button disabled={page >= staffData.totalPages} onClick={() => fetchStaff(page+1)}
                  style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${C.border}`,
                    background:C.surface, color: page>=staffData.totalPages ? C.subL : C.text,
                    cursor: page>=staffData.totalPages ? "not-allowed" : "pointer", fontSize:12 }}>
                  Trang sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
