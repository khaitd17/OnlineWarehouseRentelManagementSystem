import { useState, useEffect, useCallback } from "react";
import staffService from "../services/staffService";
import axiosClient from "../services/axiosClient";
import { useNavigate } from "react-router-dom";

/* ─── Design tokens ─────────────────────────────────────────── */
const PRIMARY   = "#4f46e5";
const PRIMARY_D = "#3730a3";
const PRIMARY_L = "#eef2ff";
const SUCCESS   = "#16a34a";
const SUCCESS_L = "#f0fdf4";
const WARN      = "#b45309";
const WARN_L    = "#fffbeb";
const DANGER    = "#b91c1c";
const DANGER_L  = "#fef2f2";
const BORDER    = "#e5e7eb";
const TEXT      = "#111827";
const MUTED     = "#6b7280";
const BG_CARD   = "#ffffff";

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  page: {
    padding: "40px 24px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxWidth: 700,
    margin: "0 auto",
  },

  /* Header strip */
  header: {
    background: `linear-gradient(135deg, ${PRIMARY} 0%, #7c3aed 100%)`,
    borderRadius: "16px 16px 0 0",
    padding: "32px 36px 28px",
    color: "#fff",
  },
  headerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.3px",
  },
  headerSub: {
    margin: "6px 0 0",
    fontSize: 13,
    opacity: 0.82,
    fontWeight: 400,
  },

  /* Step bar */
  stepBar: {
    display: "flex",
    borderBottom: `1px solid ${BORDER}`,
    background: "#fafafa",
  },
  step: (active, done) => ({
    flex: 1,
    padding: "13px 0",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 600,
    color: done ? SUCCESS : active ? PRIMARY : MUTED,
    background: done ? SUCCESS_L : active ? PRIMARY_L : "transparent",
    borderBottom: `2.5px solid ${done ? SUCCESS : active ? PRIMARY : "transparent"}`,
    transition: "all .2s",
    letterSpacing: "0.1px",
  }),

  /* Card body */
  card: {
    background: BG_CARD,
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)",
    overflow: "hidden",
  },
  body: {
    padding: "28px 36px 32px",
  },

  /* Form atoms */
  group: { marginBottom: 22 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 7,
    letterSpacing: "0.1px",
  },
  required: { color: "#ef4444", marginLeft: 2 },
  hint: {
    fontSize: 11.5,
    color: MUTED,
    marginTop: 5,
    lineHeight: 1.5,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: 9,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
    color: TEXT,
    transition: "border-color .15s",
    background: "#fdfdfd",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: 9,
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fdfdfd",
    cursor: "pointer",
    fontFamily: "inherit",
    color: TEXT,
    appearance: "auto",
  },

  divider: {
    height: 1,
    background: BORDER,
    margin: "24px -36px",
  },

  /* Alerts */
  alert: (type) => ({
    padding: "12px 16px",
    borderRadius: 9,
    marginBottom: 18,
    fontSize: 13.5,
    lineHeight: 1.55,
    background:
      type === "error"   ? DANGER_L :
      type === "success" ? SUCCESS_L : WARN_L,
    color:
      type === "error"   ? DANGER :
      type === "success" ? SUCCESS : WARN,
    border: `1px solid ${
      type === "error"   ? "#fecaca" :
      type === "success" ? "#bbf7d0" : "#fde68a"
    }`,
  }),

  /* User info card */
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 18px",
    background: "#f5f3ff",
    borderRadius: 10,
    border: `1.5px solid #ddd6fe`,
    marginBottom: 24,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
    letterSpacing: "-0.5px",
  },
  userName: { fontWeight: 700, color: TEXT, fontSize: 14.5 },
  userMeta: { fontSize: 12.5, color: "#64748b", marginTop: 2 },
  verifiedBadge: {
    display: "inline-block",
    marginTop: 6,
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 99,
    background: "#dcfce7",
    color: SUCCESS,
    border: "1px solid #86efac",
    letterSpacing: "0.2px",
  },

  /* New user info box */
  newUserBox: {
    background: WARN_L,
    border: `1.5px solid #fde68a`,
    borderRadius: 10,
    padding: "16px 20px",
    marginBottom: 22,
  },
  newUserTitle: {
    fontWeight: 700,
    color: WARN,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 1.5,
  },

  /* Role chip / caller badge */
  callerBadge: {
    marginBottom: 18,
    padding: "10px 16px",
    background: "#f0f9ff",
    borderRadius: 9,
    fontSize: 13,
    color: "#0369a1",
    border: "1px solid #bae6fd",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  rolePill: (color) => ({
    display: "inline-block",
    background: color,
    color: "#fff",
    padding: "2px 11px",
    borderRadius: 99,
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.3px",
  }),

  /* Role toggle buttons */
  roleBtn: (active) => ({
    flex: 1,
    padding: "11px 0",
    border: `2px solid ${active ? PRIMARY : BORDER}`,
    borderRadius: 9,
    background: active ? PRIMARY : "#fff",
    color: active ? "#fff" : "#374151",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13.5,
    transition: "all .18s",
    fontFamily: "inherit",
    letterSpacing: "0.1px",
  }),

  /* Skill cards */
  skillCard: (active, color) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "13px 16px",
    borderRadius: 10,
    cursor: "pointer",
    border: `2px solid ${active ? color : BORDER}`,
    background: active ? color + "12" : "#fafafa",
    transition: "all .18s",
    userSelect: "none",
  }),
  skillLabel: (active, color) => ({
    fontWeight: 700,
    fontSize: 13.5,
    color: active ? color : "#374151",
  }),
  skillDesc: {
    fontSize: 12,
    color: MUTED,
    marginTop: 3,
    lineHeight: 1.5,
  },

  /* Buttons */
  primaryBtn: (disabled) => ({
    width: "100%",
    padding: "13px",
    background: disabled ? "#a5b4fc" : PRIMARY,
    color: "#fff",
    border: "none",
    borderRadius: 9,
    fontSize: 14.5,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background .15s",
    fontFamily: "inherit",
    letterSpacing: "0.2px",
  }),
  secondBtn: {
    width: "100%",
    padding: "12px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 9,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 10,
    fontFamily: "inherit",
  },

  /* Misc */
  shiftEmpty: {
    padding: "10px 14px",
    background: "#f9fafb",
    borderRadius: 9,
    border: `1.5px solid ${BORDER}`,
    color: MUTED,
    fontSize: 13.5,
  },
  loadingText: {
    color: MUTED,
    fontSize: 13,
    marginBottom: 16,
    fontStyle: "italic",
  },
  managerNotice: {
    padding: "12px 16px",
    borderRadius: 9,
    marginBottom: 18,
    fontSize: 13.5,
    lineHeight: 1.55,
    background: SUCCESS_L,
    color: SUCCESS,
    border: "1px solid #bbf7d0",
    fontWeight: 500,
  },
  readonlyRole: {
    padding: "11px 14px",
    background: "#f9fafb",
    borderRadius: 9,
    border: `1.5px solid ${BORDER}`,
    color: "#374151",
    fontSize: 13.5,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  readonlyRoleNote: {
    color: "#9ca3af",
    fontSize: 12,
    marginLeft: "auto",
  },
};

/* ─── Constants ──────────────────────────────────────────────── */
const SKILL_DEFS = [
  {
    code: "CHECKER",
    label: "Checker",
    desc: "Xác nhận nhập/xuất hàng vật lý (bước cuối — confirm movement)",
    color: "#4f46e5",
  },
  {
    code: "INVENTORY_OPERATOR",
    label: "Inventory Operator",
    desc: "Kiểm kê định kỳ, ghi nhận kết quả kiểm kê (audit session)",
    color: "#0369a1",
  },
  {
    code: "WAREHOUSE_WORKER",
    label: "Warehouse Worker",
    desc: "Nhân viên phổ thông — tham gia ca làm việc, điểm danh",
    color: "#15803d",
  },
];

const ROLE_PRIO = { OPERATOR: 0, MANAGER: 1, OWNER: 2 };

function deduplicateWarehouses(list) {
  const map = {};
  for (const w of list) {
    const ex = map[w.warehouseId];
    if (!ex) { map[w.warehouseId] = w; continue; }
    if ((ROLE_PRIO[w.roleCode] ?? 99) < (ROLE_PRIO[ex.roleCode] ?? 99)) map[w.warehouseId] = w;
  }
  return Object.values(map);
}

/* ─── Component ──────────────────────────────────────────────── */
export default function CreateStaff() {
  const navigate = useNavigate();

  const [step,              setStep]             = useState(1);
  const [managedWarehouses, setManagedWarehouses] = useState([]);
  const [loadingInit,       setLoadingInit]       = useState(true);
  const [accessDenied,      setAccessDenied]      = useState(false);
  const [error,             setError]             = useState("");
  const [success,           setSuccess]           = useState("");

  // Step 1
  const [emailInput,  setEmailInput]  = useState("");
  const [checking,    setChecking]    = useState(false);
  const [foundUser,   setFoundUser]   = useState(null);
  const [newUserInfo, setNewUserInfo] = useState({ fullName: "", phone: "" });

  // Step 2
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [callerMembership,    setCallerMembership]    = useState(null);
  const [warehouseOptions,    setWarehouseOptions]    = useState({ skills: [] });
  const [warehouseShifts,     setWarehouseShifts]     = useState([]);
  const [loadingWhOptions,    setLoadingWhOptions]    = useState(false);
  const [form, setForm] = useState({
    targetRoleCode:     "STAFF",
    selectedSkillCodes: [],
    isAllSkill:         true,
    warehouseShiftId:   null,
  });
  const [submitting, setSubmitting] = useState(false);

  /* Init */
  useEffect(() => {
    staffService.getMyManagedWarehouses()
      .then(w => {
        const deduped = deduplicateWarehouses(w || []);
        setManagedWarehouses(deduped);
        if (deduped.length === 0) setAccessDenied(true);
      })
      .catch(() => setAccessDenied(true))
      .finally(() => setLoadingInit(false));
  }, []);

  /* Step 1: check email */
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const email = emailInput.trim();
    if (!email) return setError("Vui lòng nhập email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Email không hợp lệ.");
    setChecking(true);
    try {
      const res = await axiosClient.get(`/staff/check-email?email=${encodeURIComponent(email)}`);
      setFoundUser({ ...res.data, email });
      if (!res.data.exists) setNewUserInfo({ fullName: "", phone: "" });
      setStep(2);
    } catch {
      setError("Không thể kiểm tra email. Vui lòng thử lại.");
    } finally { setChecking(false); }
  };

  /* Step 2: warehouse change */
  const handleWarehouseChange = useCallback(async (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    setCallerMembership(null);
    setWarehouseOptions({ skills: [] });
    setWarehouseShifts([]);
    setForm(f => ({ ...f, targetRoleCode: "STAFF", selectedSkillCodes: [], isAllSkill: true, warehouseShiftId: null }));
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
      setError("Không thể tải thông tin kho: " + (err.response?.data?.message || 'Có lỗi xảy ra'));
    } finally { setLoadingWhOptions(false); }
  }, []);

  const isOperator = callerMembership?.allRoleCodes?.includes("OPERATOR")
                  || callerMembership?.roleCode === "OPERATOR";
  const isManager  = callerMembership?.roleCode === "MANAGER" && !isOperator;

  const getSkillIdByCode = (code) =>
    warehouseOptions.skills?.find(s => s.code === code)?.id ?? null;

  const toggleSkill = (code) => {
    setForm(f => ({
      ...f,
      selectedSkillCodes: f.selectedSkillCodes.includes(code)
        ? f.selectedSkillCodes.filter(c => c !== code)
        : [...f.selectedSkillCodes, code],
    }));
  };

  const handleRoleChange = (roleCode) => {
    setForm(f => ({ ...f, targetRoleCode: roleCode, isAllSkill: true, selectedSkillCodes: [] }));
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!selectedWarehouseId) return setError("Vui lòng chọn kho.");
    if (!foundUser?.exists && !newUserInfo.fullName.trim()) return setError("Vui lòng nhập họ và tên.");
    if (isManager && form.targetRoleCode !== "STAFF") return setError("Manager chỉ được tạo STAFF.");

    const isManagerTarget = form.targetRoleCode === "MANAGER";
    const skillIds = form.selectedSkillCodes.map(c => getSkillIdByCode(c)).filter(id => id !== null);

    setSubmitting(true);
    try {
      const payload = {
        fullName:         foundUser?.exists ? foundUser.fullName : newUserInfo.fullName.trim(),
        email:            emailInput.trim(),
        phone:            foundUser?.exists ? foundUser.phone : (newUserInfo.phone.trim() || null),
        warehouseId:      parseInt(selectedWarehouseId),
        targetRoleCode:   form.targetRoleCode,
        skillIds:         isManagerTarget ? [] : skillIds,
        isAllSkill:       isManagerTarget ? true : form.isAllSkill,
        warehouseShiftId: form.warehouseShiftId || null,
      };
      const result = await staffService.createStaff(payload);
      setSuccess(`Nhân viên đã được gán vào kho thành công! (User ID: ${result.staffUserId})`);
      setTimeout(() => navigate("/list-staff"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setSubmitting(false); }
  };

  /* ── Guards ── */
  if (loadingInit) return (
    <div style={{ ...S.page, textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 15, color: MUTED }}>Đang kiểm tra quyền truy cập...</div>
    </div>
  );
  if (accessDenied) return (
    <div style={{ ...S.page, textAlign: "center", paddingTop: 80 }}>
      <h2 style={{ color: DANGER, marginBottom: 10 }}>Không có quyền truy cập</h2>
      <p style={{ color: MUTED }}>
        Bạn cần role <strong>OPERATOR</strong> hoặc <strong>MANAGER</strong> trong ít nhất một kho.
      </p>
      <button onClick={() => navigate("/owner-dashboard")} style={{ ...S.primaryBtn(false), width: "auto", padding: "10px 28px", marginTop: 24 }}>
        Quay lại
      </button>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* ── Header ── */}
        <div style={S.header}>
          <h2 style={S.headerTitle}>Thêm Nhân Viên</h2>
          <p style={S.headerSub}>Tìm kiếm nhân viên theo email và phân quyền theo kho</p>
        </div>

        {/* ── Step bar ── */}
        <div style={S.stepBar}>
          <div style={S.step(step === 1, step > 1)}>
            {step > 1 ? "Hoàn thành  ·  " : ""}Bước 1 — Tìm kiếm email
          </div>
          <div style={S.step(step === 2, false)}>
            Bước 2 — Phân quyền theo kho
          </div>
        </div>

        {/* ── Body ── */}
        <div style={S.body}>
          {error   && <div style={S.alert("error")}>{error}</div>}
          {success && <div style={S.alert("success")}>{success}</div>}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleCheckEmail}>
              <div style={S.group}>
                <label style={S.label}>
                  Email nhân viên<span style={S.required}>*</span>
                </label>
                <input
                  style={S.input}
                  type="email"
                  placeholder="Nhập địa chỉ email..."
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setError(""); }}
                  autoFocus
                />
                <div style={S.hint}>Hệ thống sẽ kiểm tra xem email này đã có tài khoản hay chưa.</div>
              </div>
              <button
                type="submit"
                disabled={checking}
                style={S.primaryBtn(checking)}
              >
                {checking ? "Đang kiểm tra..." : "Tìm kiếm"}
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>

              {/* User info */}
              {foundUser?.exists ? (
                <div style={S.userCard}>
                  <div style={S.avatar}>
                    {foundUser.fullName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.userName}>{foundUser.fullName}</div>
                    <div style={S.userMeta}>{foundUser.email}</div>
                    {foundUser.phone && (
                      <div style={{ ...S.userMeta, marginTop: 1 }}>{foundUser.phone}</div>
                    )}
                    <span style={S.verifiedBadge}>Đã có tài khoản</span>
                  </div>
                </div>
              ) : (
                <div style={S.newUserBox}>
                  <div style={S.newUserTitle}>
                    Email <strong>{emailInput}</strong> chưa có tài khoản — vui lòng bổ sung thông tin
                  </div>
                  <div style={{ ...S.group, marginBottom: 14 }}>
                    <label style={S.label}>Họ và tên<span style={S.required}>*</span></label>
                    <input
                      style={S.input}
                      placeholder="Nhập họ và tên đầy đủ"
                      value={newUserInfo.fullName}
                      onChange={e => setNewUserInfo(f => ({ ...f, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={S.label}>Số điện thoại</label>
                    <input
                      style={S.input}
                      placeholder="Số điện thoại (tuỳ chọn)"
                      value={newUserInfo.phone}
                      onChange={e => setNewUserInfo(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div style={{ ...S.hint, marginTop: 10, color: WARN }}>
                    Hệ thống sẽ tự tạo tài khoản và gửi mật khẩu tạm thời qua email.
                  </div>
                </div>
              )}

              <div style={S.divider} />

              {/* Warehouse selector */}
              <div style={S.group}>
                <label style={S.label}>
                  Kho làm việc<span style={S.required}>*</span>
                </label>
                <select
                  style={S.select}
                  value={selectedWarehouseId}
                  onChange={e => handleWarehouseChange(e.target.value)}
                >
                  <option value="">-- Chọn kho --</option>
                  {managedWarehouses.map(w => (
                    <option key={w.warehouseId} value={w.warehouseId}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              {loadingWhOptions && (
                <div style={S.loadingText}>Đang tải thông tin kho...</div>
              )}

              {callerMembership && !loadingWhOptions && (
                <>
                  {/* Caller role */}
                  <div style={S.callerBadge}>
                    <span>Quyền của bạn trong kho này:</span>
                    <span style={S.rolePill(isOperator ? PRIMARY : "#7c3aed")}>
                      {callerMembership.roleCode}
                      {isOperator ? " — Điều phối viên" : " — Quản lý"}
                    </span>
                  </div>

                  {/* Target role */}
                  <div style={S.group}>
                    <label style={S.label}>
                      Role trong kho<span style={S.required}>*</span>
                    </label>
                    {isOperator ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        {["STAFF", "MANAGER"].map(r => (
                          <button
                            key={r}
                            type="button"
                            style={S.roleBtn(form.targetRoleCode === r)}
                            onClick={() => handleRoleChange(r)}
                          >
                            {r === "STAFF" ? "Nhân viên (STAFF)" : "Quản lý (MANAGER)"}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={S.readonlyRole}>
                        <span>Nhân viên (STAFF)</span>
                        <span style={S.readonlyRoleNote}>Manager chỉ được tạo STAFF</span>
                      </div>
                    )}
                  </div>

                  {/* Skills — hidden for MANAGER target */}
                  {form.targetRoleCode !== "MANAGER" && (
                    <div style={S.group}>
                      <label style={S.label}>
                        Kỹ năng nhân viên
                        <span style={{ color: MUTED, fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                          (mặc định: toàn kỹ năng)
                        </span>
                      </label>

                      {/* All-skill toggle */}
                      <div
                        onClick={() =>
                          setForm(f => ({ ...f, isAllSkill: !f.isAllSkill, selectedSkillCodes: [] }))
                        }
                        style={{ ...S.skillCard(form.isAllSkill, "#7c3aed"), marginBottom: 8 }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={S.skillLabel(form.isAllSkill, "#7c3aed")}>Toàn kỹ năng (All Skill)</div>
                          <div style={S.skillDesc}>Nhân viên này không bị giới hạn kỹ năng trong kho</div>
                        </div>
                        <input
                          type="checkbox"
                          readOnly
                          checked={form.isAllSkill}
                          style={{ width: 17, height: 17, accentColor: "#7c3aed", flexShrink: 0 }}
                        />
                      </div>

                      {/* Individual skills */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: form.isAllSkill ? 0.38 : 1, transition: "opacity .2s" }}>
                        {SKILL_DEFS.map(sk => {
                          const active   = !form.isAllSkill && form.selectedSkillCodes.includes(sk.code);
                          const disabled = form.isAllSkill;
                          return (
                            <div
                              key={sk.code}
                              onClick={() => !disabled && toggleSkill(sk.code)}
                              style={{ ...S.skillCard(active, sk.color), cursor: disabled ? "not-allowed" : "pointer" }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={S.skillLabel(active, sk.color)}>{sk.label}</div>
                                <div style={S.skillDesc}>{sk.desc}</div>
                              </div>
                              <input
                                type="checkbox"
                                readOnly
                                checked={form.isAllSkill || form.selectedSkillCodes.includes(sk.code)}
                                style={{ width: 16, height: 16, accentColor: sk.color, flexShrink: 0 }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* MANAGER notice */}
                  {form.targetRoleCode === "MANAGER" && (
                    <div style={S.managerNotice}>
                      Quản lý được cấp <strong>toàn quyền kỹ năng</strong> mặc định trong kho.
                    </div>
                  )}

                  {/* Shift */}
                  <div style={S.group}>
                    <label style={S.label}>Ca làm việc</label>
                    {warehouseShifts.length === 0 ? (
                      <div style={S.shiftEmpty}>Ca xoay (kho chưa có ca cố định)</div>
                    ) : (
                      <select
                        style={S.select}
                        value={form.warehouseShiftId ?? ""}
                        onChange={e =>
                          setForm(f => ({ ...f, warehouseShiftId: e.target.value ? parseInt(e.target.value) : null }))
                        }
                      >
                        <option value="">Ca xoay (không cố định)</option>
                        {warehouseShifts.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.startTime} – {s.endTime})
                          </option>
                        ))}
                      </select>
                    )}
                    <div style={S.hint}>Ca cố định được dùng khi tạo lịch tự động.</div>
                  </div>

                  <button type="submit" disabled={submitting} style={S.primaryBtn(submitting)}>
                    {submitting
                      ? "Đang xử lý..."
                      : foundUser?.exists
                        ? "Gán nhân viên vào kho"
                        : "Tạo tài khoản và gán vào kho"}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFoundUser(null);
                  setSelectedWarehouseId("");
                  setCallerMembership(null);
                  setError("");
                }}
                style={S.secondBtn}
              >
                Quay lại — Tìm email khác
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
