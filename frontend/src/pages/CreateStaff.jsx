import { useState, useEffect, useCallback } from "react";
import staffService from "../services/staffService";
import { useNavigate } from "react-router-dom";

function CreateStaff() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [managedWarehouses, setManagedWarehouses] = useState([]); // kho mà user có quyền thêm NV
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [callerMembership, setCallerMembership] = useState(null); // membership + role của caller
  const [warehouseOptions, setWarehouseOptions] = useState({ skills: [], zones: [] }); // danh sách skill/zone của kho

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    targetRoleCode: "STAFF",
    skillIds: [],
    zoneIds: [],
    isAllSkill: false,
    isAllZone: false,
  });

  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingWarehouseOptions, setLoadingWarehouseOptions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  // ── Tải danh sách kho mà caller có quyền quản lý ──────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const warehouses = await staffService.getMyManagedWarehouses();
        setManagedWarehouses(warehouses || []);
        if (!warehouses || warehouses.length === 0) {
          setAccessDenied(true);
        }
      } catch {
        setAccessDenied(true);
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  // ── Khi chọn kho: tải membership + skills/zones của kho đó ────────────────
  const handleWarehouseChange = useCallback(async (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    setCallerMembership(null);
    setWarehouseOptions({ skills: [], zones: [] });
    setForm(f => ({
      ...f,
      targetRoleCode: "STAFF",
      skillIds: [],
      zoneIds: [],
      isAllSkill: false,
      isAllZone: false,
    }));

    if (!warehouseId) return;

    setLoadingWarehouseOptions(true);
    try {
      const [membership, options] = await Promise.all([
        staffService.getMyMembership(parseInt(warehouseId)),
        staffService.getWarehouseOptions(parseInt(warehouseId)),
      ]);
      setCallerMembership(membership);
      setWarehouseOptions(options);
    } catch (err) {
      setError("Không thể tải thông tin kho: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingWarehouseOptions(false);
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isOperator = callerMembership?.roleCode === "OPERATOR";
  const isManager  = callerMembership?.roleCode === "MANAGER";

  // Skills/zones hiển thị dựa trên quyền của caller
  const availableSkills = isOperator
    ? warehouseOptions.skills
    : warehouseOptions.skills.filter(s => callerMembership?.skillIds?.includes(s.id));

  const availableZones = isOperator
    ? warehouseOptions.zones
    : warehouseOptions.zones.filter(z => callerMembership?.zoneIds?.includes(z.id));

  const toggleMultiSelect = (field, id) => {
    setForm(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id],
      };
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim()) return setError("Vui lòng nhập họ và tên.");
    if (!form.email.trim())    return setError("Vui lòng nhập email.");
    if (!selectedWarehouseId)  return setError("Vui lòng chọn kho.");

    // MANAGER chỉ được tạo STAFF (thực ra đã cố định nhưng verify lại)
    if (isManager && form.targetRoleCode !== "STAFF") {
      return setError("Manager chỉ được phép tạo nhân viên STAFF.");
    }

    setLoading(true);
    try {
      const payload = {
        fullName:       form.fullName.trim(),
        email:          form.email.trim(),
        phone:          form.phone.trim() || null,
        warehouseId:    parseInt(selectedWarehouseId),
        targetRoleCode: form.targetRoleCode,
        skillIds:       form.isAllSkill ? [] : form.skillIds,
        zoneIds:        form.isAllZone  ? [] : form.zoneIds,
        isAllSkill:     form.isAllSkill,
        isAllZone:      form.isAllZone,
      };

      const result = await staffService.createStaff(payload);
      setSuccess(`✅ Nhân viên đã được tạo thành công! (User ID: ${result.staffUserId})`);

      // Reset form
      setForm({ fullName:"", email:"", phone:"", targetRoleCode:"STAFF",
                skillIds:[], zoneIds:[], isAllSkill:false, isAllZone:false });

      setTimeout(() => navigate("/list-staff"), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError("❌ " + msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const styles = {
    page:       { padding:"32px", fontFamily:"'Segoe UI', Arial, sans-serif", maxWidth:"700px", margin:"0 auto" },
    card:       { background:"#fff", borderRadius:"12px", boxShadow:"0 4px 24px rgba(0,0,0,.1)", padding:"32px" },
    title:      { fontSize:"24px", fontWeight:"700", color:"#1a1a2e", marginBottom:"24px", borderBottom:"2px solid #4f46e5", paddingBottom:"12px" },
    label:      { display:"block", fontWeight:"600", color:"#374151", marginBottom:"6px", fontSize:"14px" },
    input:      { width:"100%", padding:"10px 14px", border:"1.5px solid #d1d5db", borderRadius:"8px", fontSize:"14px", boxSizing:"border-box", outline:"none", transition:"border .2s" },
    select:     { width:"100%", padding:"10px 14px", border:"1.5px solid #d1d5db", borderRadius:"8px", fontSize:"14px", boxSizing:"border-box", background:"#fff", cursor:"pointer" },
    group:      { marginBottom:"20px" },
    roleTab:    { display:"flex", gap:"8px", marginBottom:"4px" },
    tabBtn:     (active) => ({ padding:"8px 20px", border:"2px solid " + (active ? "#4f46e5" : "#d1d5db"), borderRadius:"20px", background: active ? "#4f46e5" : "#fff", color: active ? "#fff" : "#6b7280", fontWeight:"600", cursor:"pointer", fontSize:"14px", transition:"all .2s" }),
    chipsArea:  { display:"flex", flexWrap:"wrap", gap:"8px", padding:"12px", border:"1.5px solid #d1d5db", borderRadius:"8px", minHeight:"48px", background:"#fafafa" },
    chip:       (active) => ({ padding:"4px 12px", borderRadius:"16px", border:"1.5px solid " + (active ? "#4f46e5" : "#d1d5db"), background: active ? "#ede9fe" : "#fff", color: active ? "#4f46e5" : "#374151", cursor:"pointer", fontSize:"13px", fontWeight:"500", transition:"all .15s" }),
    submitBtn:  { width:"100%", padding:"12px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:"8px", fontSize:"16px", fontWeight:"700", cursor:"pointer", transition:"background .2s" },
    cancelBtn:  { width:"100%", padding:"12px", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:"8px", fontSize:"15px", fontWeight:"600", cursor:"pointer", marginTop:"10px" },
    badgePill:  (color) => ({ display:"inline-block", background:color, padding:"3px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:"600", marginLeft:"8px" }),
    alert:      (type) => ({ padding:"12px 16px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px",
                              background: type==="error" ? "#fef2f2" : "#f0fdf4",
                              color:      type==="error" ? "#b91c1c"  : "#166534",
                              border:     "1px solid " + (type==="error" ? "#fecaca" : "#bbf7d0") }),
    checkRow:   { display:"flex", alignItems:"center", gap:"8px", marginTop:"8px", fontSize:"14px", color:"#374151" },
    note:       { fontSize:"12px", color:"#6b7280", marginTop:"4px" },
  };

  // ── Access Denied ──────────────────────────────────────────────────────────
  if (loadingInit) {
    return (
      <div style={{ ...styles.page, textAlign:"center", paddingTop:"80px" }}>
        <div style={{ fontSize:"18px", color:"#6b7280" }}>⏳ Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ ...styles.page, textAlign:"center", paddingTop:"80px" }}>
        <div style={{ fontSize:"48px", marginBottom:"16px" }}>🔒</div>
        <h2 style={{ color:"#b91c1c" }}>Không có quyền truy cập</h2>
        <p style={{ color:"#6b7280" }}>Bạn cần có role <strong>OPERATOR</strong> hoặc <strong>MANAGER</strong> trong ít nhất một kho để sử dụng chức năng này.</p>
        <button onClick={() => navigate("/dashboard")} style={{ ...styles.submitBtn, width:"auto", padding:"10px 24px", marginTop:"24px" }}>
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  // ── Render form ──────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>👤 Thêm Nhân Viên Mới</h2>

        {error   && <div style={styles.alert("error")}>{error}</div>}
        {success && <div style={styles.alert("success")}>{success}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Chọn kho ── */}
          <div style={styles.group}>
            <label style={styles.label}>Kho làm việc <span style={{ color:"#ef4444" }}>*</span></label>
            <select
              style={styles.select}
              value={selectedWarehouseId}
              onChange={e => handleWarehouseChange(e.target.value)}
            >
              <option value="">-- Chọn kho --</option>
              {managedWarehouses.map(w => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  {w.warehouseName}
                  {w.roleCode === "OPERATOR" ? " 🔑 (Operator)" : " 🗂 (Manager)"}
                </option>
              ))}
            </select>
          </div>

          {/* ── Nội dung form hiển thị sau khi chọn kho ── */}
          {loadingWarehouseOptions && (
            <div style={{ color:"#6b7280", marginBottom:"16px" }}>⏳ Đang tải thông tin kho...</div>
          )}

          {callerMembership && !loadingWarehouseOptions && (
            <>
              {/* Hiển thị quyền hiện tại */}
              <div style={{ marginBottom:"20px", padding:"10px 14px", background:"#f0f9ff", borderRadius:"8px", fontSize:"14px", color:"#0369a1", border:"1px solid #bae6fd" }}>
                Bạn đang thao tác với quyền:
                <span style={styles.badgePill(callerMembership.roleCode === "OPERATOR" ? "#4f46e5" : "#7c3aed") }>
                  {callerMembership.roleCode}
                  {callerMembership.roleCode === "OPERATOR" ? " — Điều phối viên" : " — Quản lý"}
                </span>
              </div>

              {/* ── Họ và tên ── */}
              <div style={styles.group}>
                <label style={styles.label}>Họ và tên <span style={{ color:"#ef4444" }}>*</span></label>
                <input
                  style={styles.input}
                  placeholder="Nhập họ và tên đầy đủ"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                />
              </div>

              {/* ── Email ── */}
              <div style={styles.group}>
                <label style={styles.label}>Email <span style={{ color:"#ef4444" }}>*</span></label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Nhập địa chỉ email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <div style={styles.note}>Nếu email chưa có tài khoản, hệ thống sẽ tự tạo và gửi mật khẩu qua email.</div>
              </div>

              {/* ── Số điện thoại ── */}
              <div style={styles.group}>
                <label style={styles.label}>Số điện thoại</label>
                <input
                  style={styles.input}
                  placeholder="Nhập số điện thoại (tuỳ chọn)"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>

              {/* ── Role muốn gán (chỉ OPERATOR được chọn MANAGER) ── */}
              <div style={styles.group}>
                <label style={styles.label}>Role trong kho <span style={{ color:"#ef4444" }}>*</span></label>
                {isOperator ? (
                  <div style={styles.roleTab}>
                    {["STAFF", "MANAGER"].map(r => (
                      <button
                        key={r}
                        type="button"
                        style={styles.tabBtn(form.targetRoleCode === r)}
                        onClick={() => setForm(f => ({ ...f, targetRoleCode: r, skillIds:[], zoneIds:[], isAllSkill:false, isAllZone:false }))}
                      >
                        {r === "STAFF" ? "👷 Nhân viên (STAFF)" : "🗂 Quản lý (MANAGER)"}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding:"10px 14px", background:"#f9fafb", borderRadius:"8px", border:"1.5px solid #d1d5db", color:"#374151", fontSize:"14px" }}>
                    👷 Nhân viên (STAFF) <span style={{ color:"#9ca3af", fontSize:"12px" }}>— Manager chỉ được tạo nhân viên cấp STAFF</span>
                  </div>
                )}
              </div>

              {/* ── Skills ── */}
              <div style={styles.group}>
                <label style={styles.label}>Bộ phận phụ trách (Skills)</label>

                {isOperator && (
                  <label style={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.isAllSkill}
                      onChange={e => setForm(f => ({ ...f, isAllSkill: e.target.checked, skillIds:[] }))}
                    />
                    Phụ trách tất cả bộ phận
                  </label>
                )}

                {!form.isAllSkill && (
                  <div style={{ ...styles.chipsArea, marginTop:"8px" }}>
                    {availableSkills.length === 0 ? (
                      <span style={{ color:"#9ca3af", fontSize:"13px" }}>Không có skill nào</span>
                    ) : availableSkills.map(s => (
                      <span
                        key={s.id}
                        style={styles.chip(form.skillIds.includes(s.id))}
                        onClick={() => toggleMultiSelect("skillIds", s.id)}
                      >
                        {s.name} ({s.code})
                      </span>
                    ))}
                  </div>
                )}
                <div style={styles.note}>
                  {isManager ? "Chỉ hiển thị skills trong phạm vi quản lý của bạn." : "Chọn các bộ phận nhân viên sẽ phụ trách."}
                </div>
              </div>

              {/* ── Zones ── */}
              <div style={styles.group}>
                <label style={styles.label}>Khu vực phụ trách (Zones)</label>

                {isOperator && (
                  <label style={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.isAllZone}
                      onChange={e => setForm(f => ({ ...f, isAllZone: e.target.checked, zoneIds:[] }))}
                    />
                    Phụ trách tất cả khu vực
                  </label>
                )}

                {!form.isAllZone && (
                  <div style={{ ...styles.chipsArea, marginTop:"8px" }}>
                    {availableZones.length === 0 ? (
                      <span style={{ color:"#9ca3af", fontSize:"13px" }}>Không có zone nào</span>
                    ) : availableZones.map(z => (
                      <span
                        key={z.id}
                        style={styles.chip(form.zoneIds.includes(z.id))}
                        onClick={() => toggleMultiSelect("zoneIds", z.id)}
                      >
                        {z.name} ({z.code})
                      </span>
                    ))}
                  </div>
                )}
                <div style={styles.note}>
                  {isManager ? "Chỉ hiển thị zones trong phạm vi quản lý của bạn." : "Chọn khu vực nhân viên sẽ làm việc."}
                </div>
              </div>

              {/* ── Buttons ── */}
              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "⏳ Đang xử lý..." : "✅ Tạo nhân viên"}
              </button>
              <button type="button" onClick={() => navigate("/list-staff")} style={styles.cancelBtn}>
                Hủy
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default CreateStaff;
