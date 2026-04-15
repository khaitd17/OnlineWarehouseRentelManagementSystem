import { useState, useEffect, useCallback } from "react";
import staffService from "../services/staffService";
import axiosClient from "../services/axiosClient";
import { useNavigate } from "react-router-dom";

/* ─── Accent palette ────────────────────────────────────── */
const A = "#4f46e5";
const ALT = "#e0e7ff";

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  page:     { padding:"32px", fontFamily:"'Inter','Segoe UI',sans-serif", maxWidth:"680px", margin:"0 auto" },
  card:     { background:"#fff", borderRadius:"16px", boxShadow:"0 4px 32px rgba(0,0,0,.1)", overflow:"hidden" },
  header:   { background:`linear-gradient(135deg,${A},#7c3aed)`, padding:"28px 32px", color:"#fff" },
  body:     { padding:"28px 32px" },
  label:    { display:"block", fontWeight:600, color:"#374151", marginBottom:6, fontSize:14 },
  input:    { width:"100%", padding:"10px 14px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:14, boxSizing:"border-box", outline:"none", transition:"border .2s", fontFamily:"inherit" },
  select:   { width:"100%", padding:"10px 14px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:14, boxSizing:"border-box", background:"#fff", cursor:"pointer", fontFamily:"inherit" },
  group:    { marginBottom:20 },
  tabBtn: (a) => ({ padding:"8px 20px", border:`2px solid ${a?A:"#d1d5db"}`, borderRadius:20, background:a?A:"#fff", color:a?"#fff":"#6b7280", fontWeight:600, cursor:"pointer", fontSize:14, transition:"all .2s" }),
  btn:    (danger) => ({ width:"100%", padding:"12px", background:danger?"#ef4444":A, color:"#fff", border:"none", borderRadius:8, fontSize:15, fontWeight:700, cursor:"pointer", transition:"background .2s" }),
  btnOut:   { width:"100%", padding:"12px", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", marginTop:10 },
  alert:  (t) => ({ padding:"12px 16px", borderRadius:8, marginBottom:16, fontSize:14, background:t==="error"?"#fef2f2":"#f0fdf4", color:t==="error"?"#b91c1c":"#166534", border:`1px solid ${t==="error"?"#fecaca":"#bbf7d0"}` }),
  badge:  (c) => ({ display:"inline-block", background:c, color:"#fff", padding:"2px 10px", borderRadius:12, fontSize:12, fontWeight:600, marginLeft:8 }),
  note:     { fontSize:12, color:"#6b7280", marginTop:4 },
  divider:  { height:1, background:"#f1f5f9", margin:"24px 0" },
  steps:    { display:"flex", gap:0, marginBottom:28 },
  step:   (active, done) => ({
    flex:1, padding:"10px 0", textAlign:"center", fontSize:12, fontWeight:600,
    color: done ? "#166534" : active ? A : "#9ca3af",
    background: done ? "#f0fdf4" : active ? ALT : "#f8fafc",
    borderBottom:`2px solid ${done?"#22c55e":active?A:"transparent"}`,
    transition:"all .25s",
  }),
  userCard: { display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"#f5f3ff", borderRadius:10, border:`1.5px solid ${ALT}`, marginBottom:20 },
  skillCard: (active, color) => ({
    display:"flex", alignItems:"flex-start", gap:12,
    padding:"12px 16px", borderRadius:10, cursor:"pointer",
    border:`2px solid ${active ? color : "#d1d5db"}`,
    background: active ? color + "18" : "#fafafa",
    transition:"all .18s", userSelect:"none",
  }),
};

/* ─── Skill definitions ──────────────────────────────────── */
const SKILL_DEFS = [
  {
    code: "CHECKER",
    label: "Checker",
    desc: "Xác nhận nhập/xuất hàng vật lý (bước cuối — confirm movement)",
    color: "#4f46e5",
    icon: "✅",
  },
  {
    code: "INVENTORY_OPERATOR",
    label: "Inventory Operator",
    desc: "Kiểm kê định kỳ, ghi nhận kết quả kiểm kê (audit session)",
    color: "#0369a1",
    icon: "📦",
  },
  {
    code: "WAREHOUSE_WORKER",
    label: "Warehouse Worker",
    desc: "Nhân viên phổ thông — tham gia ca làm việc, điểm danh",
    color: "#15803d",
    icon: "👷",
  },
];

/* ─── Component ──────────────────────────────────────────── */
export default function CreateStaff() {
  const navigate = useNavigate();

  // ── Global state ────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [managedWarehouses,   setManagedWarehouses]   = useState([]);
  const [loadingInit,         setLoadingInit]         = useState(true);
  const [accessDenied,        setAccessDenied]        = useState(false);
  const [error,               setError]               = useState("");
  const [success,             setSuccess]             = useState("");

  // ── Step 1: email lookup ─────────────────────────────────
  const [emailInput,  setEmailInput]  = useState("");
  const [checking,    setChecking]    = useState(false);
  const [foundUser,   setFoundUser]   = useState(null);
  const [newUserInfo, setNewUserInfo] = useState({ fullName:"", phone:"" });

  // ── Step 2: warehouse assignment ─────────────────────────
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [callerMembership,    setCallerMembership]    = useState(null);
  const [warehouseOptions,    setWarehouseOptions]    = useState({ skills:[] });
  const [warehouseShifts,     setWarehouseShifts]     = useState([]);
  const [loadingWhOptions,    setLoadingWhOptions]    = useState(false);
  const [form, setForm] = useState({
    targetRoleCode:     "STAFF",
    selectedSkillCodes: [],   // multi-select: array of skill CODE strings
    isAllSkill:         false,
    warehouseShiftId:   null,
  });
  const [submitting, setSubmitting] = useState(false);

  /* ── Init: load managed warehouses ── */
  useEffect(() => {
    staffService.getMyManagedWarehouses()
      .then(w => {
        setManagedWarehouses(w || []);
        if (!w || w.length === 0) setAccessDenied(true);
      })
      .catch(() => setAccessDenied(true))
      .finally(() => setLoadingInit(false));
  }, []);

  /* ── Step 1: check email ── */
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const email = emailInput.trim();
    if (!email) return setError("Vui lòng nhập email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Email không hợp lệ.");
    setChecking(true);
    try {
      const res = await axiosClient.get(`/staff/check-email?email=${encodeURIComponent(email)}`);
      setFoundUser(res.data);
      if (!res.data.exists) setNewUserInfo({ fullName:"", phone:"" });
      setStep(2);
    } catch {
      setError("Không thể kiểm tra email. Vui lòng thử lại.");
    } finally {
      setChecking(false);
    }
  };

  /* ── Step 2: load warehouse options ── */
  const handleWarehouseChange = useCallback(async (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    setCallerMembership(null);
    setWarehouseOptions({ skills:[] });
    setWarehouseShifts([]);
    setForm(f => ({ ...f, targetRoleCode:"STAFF", selectedSkillCodes:[], isAllSkill:false, warehouseShiftId:null }));
    if (!warehouseId) return;
    setLoadingWhOptions(true);
    try {
      const [membership, options, shifts] = await Promise.all([
        staffService.getMyMembership(parseInt(warehouseId)),
        staffService.getWarehouseOptions(parseInt(warehouseId)),
        axiosClient.get(`/schedule/warehouse-shifts?warehouseId=${warehouseId}`).then(r => r.data).catch(() => []),
      ]);
      setCallerMembership(membership);
      setWarehouseOptions(options);
      setWarehouseShifts(shifts || []);
    } catch (err) {
      setError("Không thể tải thông tin kho: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingWhOptions(false);
    }
  }, []);

  const isOperator = callerMembership?.roleCode === "OPERATOR";
  const isManager  = callerMembership?.roleCode === "MANAGER";

  // Get skill ID from code using warehouse options API data
  const getSkillIdByCode = (code) =>
    warehouseOptions.skills?.find(s => s.code === code)?.id ?? null;

  // Toggle a skill in multi-select
  const toggleSkill = (code) => {
    setForm(f => {
      const already = f.selectedSkillCodes.includes(code);
      return {
        ...f,
        selectedSkillCodes: already
          ? f.selectedSkillCodes.filter(c => c !== code)
          : [...f.selectedSkillCodes, code],
      };
    });
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!selectedWarehouseId) return setError("Vui lòng chọn kho.");
    if (!foundUser?.exists && !newUserInfo.fullName.trim()) return setError("Vui lòng nhập họ và tên.");
    if (isManager && form.targetRoleCode !== "STAFF") return setError("Manager chỉ được tạo STAFF.");

    // Resolve skill IDs from selected codes
    const skillIds = form.selectedSkillCodes
      .map(code => getSkillIdByCode(code))
      .filter(id => id !== null);

    setSubmitting(true);
    try {
      const payload = {
        fullName:         foundUser?.exists ? foundUser.fullName : newUserInfo.fullName.trim(),
        email:            emailInput.trim(),
        phone:            foundUser?.exists ? foundUser.phone : (newUserInfo.phone.trim() || null),
        warehouseId:      parseInt(selectedWarehouseId),
        targetRoleCode:   form.targetRoleCode,
        skillIds,
        isAllSkill:       form.isAllSkill,
        warehouseShiftId: form.warehouseShiftId || null,
      };
      const result = await staffService.createStaff(payload);
      setSuccess(`✅ Nhân viên đã được gán vào kho thành công! (User ID: ${result.staffUserId})`);
      setTimeout(() => navigate("/list-staff"), 2000);
    } catch (err) {
      setError("❌ " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Guards ── */
  if (loadingInit) return (
    <div style={{ ...S.page, textAlign:"center", paddingTop:80 }}>
      <div style={{ fontSize:18, color:"#6b7280" }}>⏳ Đang kiểm tra quyền truy cập...</div>
    </div>
  );

  if (accessDenied) return (
    <div style={{ ...S.page, textAlign:"center", paddingTop:80 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <h2 style={{ color:"#b91c1c" }}>Không có quyền truy cập</h2>
      <p style={{ color:"#6b7280" }}>Bạn cần role <strong>OPERATOR</strong> hoặc <strong>MANAGER</strong> trong ít nhất một kho.</p>
      <button onClick={() => navigate("/owner-dashboard")} style={{ ...S.btn(), width:"auto", padding:"10px 24px", marginTop:24 }}>
        Quay lại
      </button>
    </div>
  );

  /* ── RENDER ── */
  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Header */}
        <div style={S.header}>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800 }}>👤 Thêm Nhân Viên</h2>
          <p style={{ margin:"6px 0 0", opacity:.8, fontSize:13 }}>Tìm kiếm nhân viên theo email và phân quyền theo kho</p>
        </div>

        {/* Steps bar */}
        <div style={S.steps}>
          <div style={S.step(step===1, step>1)}>{step>1?"✓ ":""}1. Tìm kiếm email</div>
          <div style={S.step(step===2, step>2)}>2. Phân quyền theo kho</div>
        </div>

        <div style={S.body}>
          {error   && <div style={S.alert("error")}>{error}</div>}
          {success && <div style={S.alert("success")}>{success}</div>}

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <form onSubmit={handleCheckEmail}>
              <div style={S.group}>
                <label style={S.label}>Email nhân viên <span style={{ color:"#ef4444" }}>*</span></label>
                <input
                  style={S.input} type="email"
                  placeholder="Nhập địa chỉ email..."
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setError(""); }}
                  autoFocus
                />
                <div style={S.note}>Hệ thống sẽ kiểm tra email này đã có tài khoản chưa.</div>
              </div>
              <button type="submit" disabled={checking} style={{ ...S.btn(), opacity:checking?.7:1 }}>
                {checking ? "⏳ Đang kiểm tra..." : "🔍 Tìm kiếm"}
              </button>
            </form>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>

              {/* User info */}
              {foundUser?.exists ? (
                <div style={S.userCard}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:A, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:18, fontWeight:700, flexShrink:0 }}>
                    {foundUser.fullName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, color:"#1e293b" }}>{foundUser.fullName}</div>
                    <div style={{ fontSize:13, color:"#64748b" }}>{foundUser.email}</div>
                    {foundUser.phone && <div style={{ fontSize:12, color:"#94a3b8" }}>📞 {foundUser.phone}</div>}
                    <span style={{ display:"inline-block", marginTop:4, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#dcfce7", color:"#166534", border:"1px solid #86efac" }}>
                      ✓ Đã có tài khoản
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:10, padding:"16px 18px", marginBottom:20 }}>
                  <div style={{ fontWeight:700, color:"#92400e", marginBottom:12, fontSize:13 }}>
                    ✉ Email <strong>{emailInput}</strong> chưa có tài khoản — vui lòng nhập thêm thông tin
                  </div>
                  <div style={S.group}>
                    <label style={S.label}>Họ và tên <span style={{ color:"#ef4444" }}>*</span></label>
                    <input style={S.input} placeholder="Nhập họ và tên đầy đủ" value={newUserInfo.fullName}
                      onChange={e => setNewUserInfo(f => ({ ...f, fullName:e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Số điện thoại</label>
                    <input style={S.input} placeholder="Nhập số điện thoại (tuỳ chọn)" value={newUserInfo.phone}
                      onChange={e => setNewUserInfo(f => ({ ...f, phone:e.target.value }))} />
                  </div>
                  <div style={{ ...S.note, marginTop:10, color:"#92400e" }}>
                    💌 Hệ thống sẽ tự tạo tài khoản và gửi mật khẩu tạm + link đặt lại mật khẩu qua email.
                  </div>
                </div>
              )}

              <div style={S.divider} />

              {/* Chọn kho */}
              <div style={S.group}>
                <label style={S.label}>Kho làm việc <span style={{ color:"#ef4444" }}>*</span></label>
                <select style={S.select} value={selectedWarehouseId} onChange={e => handleWarehouseChange(e.target.value)}>
                  <option value="">-- Chọn kho --</option>
                  {managedWarehouses.map(w => (
                    <option key={w.warehouseId} value={w.warehouseId}>
                      {w.warehouseName}{w.roleCode==="OPERATOR"?" 🔑 (Operator)":" 🗂 (Manager)"}
                    </option>
                  ))}
                </select>
              </div>

              {loadingWhOptions && <div style={{ color:"#6b7280", marginBottom:16, fontSize:13 }}>⏳ Đang tải thông tin kho...</div>}

              {callerMembership && !loadingWhOptions && (
                <>
                  {/* Role của caller */}
                  <div style={{ marginBottom:12, padding:"8px 14px", background:"#f0f9ff", borderRadius:8, fontSize:13, color:"#0369a1", border:"1px solid #bae6fd" }}>
                    Quyền của bạn:
                    <span style={S.badge(isOperator?"#4f46e5":"#7c3aed")}>
                      {callerMembership.roleCode}{isOperator?" — Điều phối viên":" — Quản lý"}
                    </span>
                  </div>

                  {/* Role target */}
                  <div style={S.group}>
                    <label style={S.label}>Role trong kho <span style={{ color:"#ef4444" }}>*</span></label>
                    {isOperator ? (
                      <div style={{ display:"flex", gap:8 }}>
                        {["STAFF","MANAGER"].map(r => (
                          <button key={r} type="button" style={S.tabBtn(form.targetRoleCode===r)}
                            onClick={() => setForm(f => ({ ...f, targetRoleCode:r, selectedSkillCodes:[], isAllSkill:r==="MANAGER" }))}>
                            {r==="STAFF"?"👷 Nhân viên (STAFF)":"🗂 Quản lý (MANAGER)"}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding:"10px 14px", background:"#f9fafb", borderRadius:8, border:"1.5px solid #d1d5db", color:"#374151", fontSize:14 }}>
                        👷 Nhân viên (STAFF) <span style={{ color:"#9ca3af", fontSize:12 }}>— Manager chỉ được tạo STAFF</span>
                      </div>
                    )}
                  </div>

                  {/* ─── Multi-select Skills ─── */}
                  <div style={S.group}>
                    <label style={S.label}>
                      Kỹ năng nhân viên
                      <span style={{ color:"#9ca3af", fontWeight:400, fontSize:12, marginLeft:6 }}>
                        (chọn 1 hoặc nhiều — bỏ trống = nhân viên phổ thông)
                      </span>
                    </label>

                    {/* All Skill toggle — chỉ OPERATOR tạo MANAGER */}
                    {isOperator && form.targetRoleCode === "MANAGER" && (
                      <div
                        onClick={() => setForm(f => ({ ...f, isAllSkill:!f.isAllSkill, selectedSkillCodes:[] }))}
                        style={{ ...S.skillCard(form.isAllSkill, "#7c3aed"), marginBottom:8 }}>
                        <div style={{ fontSize:20 }}>⭐</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:form.isAllSkill?"#7c3aed":"#374151" }}>Toàn kỹ năng (All Skill)</div>
                          <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>Manager này quản lý tất cả kỹ năng trong kho</div>
                        </div>
                        <input type="checkbox" readOnly checked={form.isAllSkill} style={{ width:18, height:18, accentColor:"#7c3aed" }} />
                      </div>
                    )}

                    {/* Individual skill checkboxes */}
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {SKILL_DEFS.map(sk => {
                        const active   = form.selectedSkillCodes.includes(sk.code);
                        const disabled = form.isAllSkill;
                        return (
                          <div
                            key={sk.code}
                            onClick={() => !disabled && toggleSkill(sk.code)}
                            style={{
                              ...S.skillCard(active && !disabled, sk.color),
                              opacity: disabled ? 0.45 : 1,
                              cursor:  disabled ? "not-allowed" : "pointer",
                            }}>
                            <div style={{ fontSize:20 }}>{sk.icon}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:14, color:active && !disabled ? sk.color : "#374151" }}>
                                {sk.label}
                              </div>
                              <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{sk.desc}</div>
                            </div>
                            <input type="checkbox" readOnly checked={form.isAllSkill || active}
                              style={{ width:16, height:16, accentColor:sk.color }} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Hint text */}
                    {!form.isAllSkill && form.selectedSkillCodes.length === 0 && (
                      <div style={{ ...S.note, color:"#92400e", marginTop:8 }}>
                        ℹ️ Không chọn kỹ năng → nhân viên phổ thông (chỉ điểm danh, không xác nhận nhập/xuất hay kiểm kê)
                      </div>
                    )}
                    {!form.isAllSkill && form.selectedSkillCodes.length > 0 && (
                      <div style={{ ...S.note, color:"#166534", marginTop:8 }}>
                        ✓ Đã chọn: {form.selectedSkillCodes.join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Ca làm việc */}
                  <div style={S.group}>
                    <label style={S.label}>Ca làm việc</label>
                    {warehouseShifts.length === 0 ? (
                      <div style={{ padding:"9px 12px", background:"#f9fafb", borderRadius:8, border:"1.5px solid #d1d5db", color:"#6b7280", fontSize:13 }}>
                        Ca xoay (kho chưa có ca cố định)
                      </div>
                    ) : (
                      <select style={S.select} value={form.warehouseShiftId??""} onChange={e => setForm(f => ({ ...f, warehouseShiftId:e.target.value?parseInt(e.target.value):null }))}>
                        <option value="">Ca xoay (không cố định)</option>
                        {warehouseShifts.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.startTime} – {s.endTime})</option>
                        ))}
                      </select>
                    )}
                    <div style={S.note}>Ca cố định được dùng khi tạo lịch tự động Schedule tự động.</div>
                  </div>

                  <button type="submit" disabled={submitting} style={{ ...S.btn(), opacity:submitting?.7:1 }}>
                    {submitting ? "⏳ Đang xử lý..." : foundUser?.exists ? "✅ Gán nhân viên vào kho" : "✅ Tạo tài khoản & gán vào kho"}
                  </button>
                </>
              )}

              <button type="button"
                onClick={() => { setStep(1); setFoundUser(null); setSelectedWarehouseId(""); setCallerMembership(null); setError(""); }}
                style={S.btnOut}>
                ← Quay lại tìm email khác
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
