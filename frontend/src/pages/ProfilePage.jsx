import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import userService from "../services/userService";

/* ─── helpers ─────────────────────────────────────────────── */
const API = "http://localhost:5276";
const resolveUrl = (u) => (!u ? null : u.startsWith("http") ? u : `${API}${u.startsWith("/") ? u : "/" + u}`);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const fmtMoney = (n) => n != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n) : "—";

const CONTRACT_STATUS = {
  ACTIVE:    { label: "Đang hiệu lực", bg: "#dcfce7", color: "#15803d" },
  PENDING:   { label: "Chờ ký",        bg: "#fef9c3", color: "#92400e" },
  COMPLETED: { label: "Hoàn tất",      bg: "#e0e7ff", color: "#3730a3" },
  CANCELLED: { label: "Đã huỷ",        bg: "#fee2e2", color: "#991b1b" },
  SIGNED:    { label: "Đã ký",         bg: "#d1fae5", color: "#065f46" },
};

const ROLE_LABEL = {
  RENTER: "Người thuê", OWNER: "Chủ kho", STAFF: "Nhân viên",
  MANAGER: "Quản lý", ADMIN: "Quản trị viên", USER: "Người dùng",
};

/** Read role from JWT stored in localStorage as fallback */
const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const r = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      || payload["role"] || payload["Role"] || payload["roleName"] || null;
    return r ? r.toUpperCase() : null;
  } catch { return null; }
};

/** Get role immediately from localStorage (no async needed) */
const getStoredRole = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return (u.roleName || u.role || "").toUpperCase() || getRoleFromToken() || "";
  } catch { return getRoleFromToken() || ""; }
};

/* ─── sub-components ──────────────────────────────────────── */
const StatCard = ({ icon, value, label, color }) => (
  <div style={{
    background: "#fff", borderRadius: 16, padding: "20px 22px",
    border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    display: "flex", alignItems: "center", gap: 16, flex: 1,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 14,
      background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const Badge = ({ status }) => {
  const s = CONTRACT_STATUS[status?.toUpperCase()] || { label: status, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap", display: "inline-block", letterSpacing: "0.01em" }}>
      {s.label}
    </span>
  );
};

/* ─── main page ───────────────────────────────────────────── */
const ProfilePage = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", phone: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* fetch all data in parallel */
  const loadAll = useCallback(async () => {
    setLoading(true);
    // Use stored role immediately — don't wait for profile API
    const initialRole = getStoredRole();
    try {
      const [prof, notifs, rates] = await Promise.allSettled([
        userService.getProfile(),
        axiosClient.get("/notifications"),
        axiosClient.get("/ratings/my-ratings"),
      ]);

      let detectedRole = initialRole;
      if (prof.status === "fulfilled") {
        const p = prof.value;
        setProfile(p);
        setFormData({ fullName: p.fullName || "", phone: p.phone || "" });
        // profile API role takes precedence only if it's a known role
        const apiRole = (p.role || p.roleName || "").toUpperCase();
        if (["OWNER", "RENTER", "STAFF", "MANAGER", "ADMIN"].includes(apiRole)) {
          detectedRole = apiRole;
        }
      }

      const contractEndpoint = detectedRole === "OWNER"
        ? "/rental-contracts/owner-contracts"
        : "/rental-contracts/my-contracts";
      const contr = await axiosClient.get(contractEndpoint).catch(() => ({ data: [] }));
      setContracts(contr.data || []);

      if (notifs.status === "fulfilled") setNotifications(notifs.value.data || []);
      if (rates.status === "fulfilled") setRatings(rates.value.data || []);
    } catch (e) {
      showToast("Không thể tải dữ liệu.", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* handlers */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await userService.updateProfile(formData);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...formData }));
      window.dispatchEvent(new Event("authChange"));
      setIsEditing(false);
      loadAll();
      showToast("Cập nhật thông tin thành công!");
    } catch { showToast("Không thể cập nhật thông tin.", "error"); }
    setSaveLoading(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { avatarUrl } = await userService.uploadAvatar(file);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, avatarUrl }));
      window.dispatchEvent(new Event("authChange"));
      loadAll();
      showToast("Cập nhật ảnh đại diện thành công!");
    } catch { showToast("Lỗi khi tải ảnh.", "error"); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { showToast("Mật khẩu xác nhận không khớp!", "error"); return; }
    setPwLoading(true);
    try {
      await userService.changePassword(pwForm);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Đổi mật khẩu thành công!");
    } catch (err) { showToast(err.response?.data?.message || "Không thể đổi mật khẩu.", "error"); }
    setPwLoading(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.allSettled(unread.map(n => axiosClient.put(`/notifications/${n.notificationId}/read`)));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    navigate("/auth");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, color: "#64748b" }}>
      <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#0095c7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Đang tải dữ liệu...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const activeContracts = contracts.filter(c => ["ACTIVE", "SIGNED"].includes(c.status?.toUpperCase()));
  const completedContracts = contracts.filter(c => c.status?.toUpperCase() === "COMPLETED");
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const initials = (profile?.fullName || "?").charAt(0).toUpperCase();
  const avatarSrc = resolveUrl(profile?.avatarUrl);

  // Determine effective role: localStorage (most reliable) → profile API → JWT
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const effectiveRole = (
    (storedUser?.roleName || storedUser?.role || "").toUpperCase() ||
    (profile?.role || profile?.roleName || "").toUpperCase() ||
    getRoleFromToken() ||
    ""
  );

  const roleLabel = ROLE_LABEL[effectiveRole] || effectiveRole || "User";
  const isOwner = effectiveRole === "OWNER";

  const tabs = [
    { id: "profile", icon: "👤", label: "Thông tin cá nhân" },
    ...(!isOwner ? [{ id: "bookings", icon: "🏭", label: "Kho bãi đã thuê" }] : []),
    { id: "notifications", icon: "🔔", label: "Thông báo", badge: unreadCount },
  ];

  /* ── input style ── */
  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0",
    fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#1e293b",
    background: "#fff", transition: "border-color .2s, box-shadow .2s",
  };
  const readonlyStyle = {
    padding: "10px 14px", borderRadius: 10, border: "1.5px solid #f1f5f9",
    fontSize: "0.88rem", background: "#f8fafc", color: "#374151",
    fontWeight: 500, minHeight: 42, display: "flex", alignItems: "center",
  };

  return (
    <div style={{ background: "#f0f4f8", minHeight: "calc(100vh - 80px)", padding: "2rem 1rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Avatar card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 4 }}>
            <div style={{ height: 60, background: "linear-gradient(135deg,#1e40af,#0ea5e9)" }} />
            <div style={{ padding: "0 16px 20px", position: "relative" }}>
              <div style={{ position: "absolute", top: -32, left: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", overflow: "hidden", background: "linear-gradient(135deg,#1e3a8a,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 900, color: "#fff", cursor: "pointer" }}
                  onClick={() => fileRef.current?.click()}>
                  {avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              </div>
              <div style={{ paddingTop: 38 }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>{profile?.fullName}</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginTop: 2 }}>{roleLabel}</div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "8px 0", overflow: "hidden" }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 16px", border: "none", cursor: "pointer", textAlign: "left",
                  background: activeTab === tab.id ? "linear-gradient(90deg,#eff6ff,#f0f9ff)" : "transparent",
                  color: activeTab === tab.id ? "#0095c7" : "#475569",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: "0.88rem", borderLeft: `3px solid ${activeTab === tab.id ? "#0095c7" : "transparent"}`,
                  transition: "all .15s",
                }}>
                <span>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>{tab.badge}</span>
                )}
              </button>
            ))}

            <div style={{ padding: "8px 12px 4px" }}>
              <button onClick={handleLogout}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 16px", border: "none", cursor: "pointer", borderRadius: 10,
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff", fontWeight: 700, fontSize: "0.875rem",
                  boxShadow: "0 4px 12px rgba(239,68,68,0.35)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(239,68,68,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.35)"; }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: isOwner ? "Khách đang thuê" : "Đang thuê", value: activeContracts.length, color: "#10b981", icon: isOwner ? "🤝" : "🏭" },
              { label: isOwner ? "Hợp đồng hoàn tất" : "Hoàn tất",  value: completedContracts.length, color: "#6366f1", icon: "✅" },
              { label: "Đánh giá",  value: ratings.length, color: "#f59e0b", icon: "⭐" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 10, background: "#f8fafc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#475569" }}>
                  <span>{s.icon}</span>{s.label}
                </div>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* Toast */}
          {toast && (
            <div style={{
              padding: "12px 18px", borderRadius: 12, fontSize: "0.87rem", fontWeight: 600,
              background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: toast.type === "success" ? "#15803d" : "#dc2626",
              border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              display: "flex", alignItems: "center", gap: 8, animation: "fadeIn .2s ease",
            }}>
              {toast.type === "success" ? "✅" : "❌"} {toast.msg}
            </div>
          )}

          {/* ══ TAB: PROFILE ══ */}
          {activeTab === "profile" && (
            <>
              {/* Stats row */}
              <div style={{ display: "flex", gap: 14 }}>
                <StatCard icon="🏭" value={activeContracts.length} label="Kho đang thuê" color="#0ea5e9" />
                <StatCard icon="📄" value={completedContracts.length} label="Hợp đồng hoàn tất" color="#6366f1" />
                <StatCard icon="⭐" value={ratings.length} label="Đánh giá của bạn" color="#f59e0b" />
                <StatCard icon="🔔" value={unreadCount} label="Thông báo chưa đọc" color="#ef4444" />
              </div>

              {/* Profile card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {/* header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>Thông tin cá nhân</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>{isEditing ? "Chỉnh sửa thông tin của bạn" : "Xem thông tin tài khoản"}</div>
                  </div>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                      background: "linear-gradient(135deg,#0095c7,#0369a1)", color: "#fff",
                      border: "none", borderRadius: 9, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                      boxShadow: "0 3px 10px rgba(0,149,199,.3)",
                    }}>
                      ✏️ Sửa thông tin
                    </button>
                  )}
                </div>

                <div style={{ padding: "24px" }}>
                  {!isEditing ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                      {[
                        { label: "Họ và tên", value: profile?.fullName },
                        { label: "Email",     value: profile?.email },
                        { label: "Số điện thoại", value: profile?.phone || "Chưa cập nhật" },
                        { label: "Vai trò",   value: roleLabel },
                        { label: "Ngày tạo",  value: fmtDate(profile?.createdAt) },
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>{f.label}</div>
                          <div style={readonlyStyle}>{f.value || "—"}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginBottom: "1.5rem" }}>
                        {[
                          { label: "Họ và tên", key: "fullName", type: "text" },
                          { label: "Số điện thoại", key: "phone", type: "tel" },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>{f.label}</label>
                            <input type={f.type} value={formData[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                              style={inputStyle}
                              onFocus={e => { e.target.style.borderColor = "#0095c7"; e.target.style.boxShadow = "0 0 0 3px rgba(0,149,199,.1)"; }}
                              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                            />
                          </div>
                        ))}
                        <div>
                          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Email</label>
                          <div style={readonlyStyle}>{profile?.email}</div>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Vai trò</label>
                          <div style={readonlyStyle}>{roleLabel}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "9px 20px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 9, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", color: "#64748b" }}>Hủy</button>
                        <button type="submit" disabled={saveLoading} style={{ padding: "9px 22px", background: "linear-gradient(135deg,#0095c7,#0369a1)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,149,199,.3)" }}>
                          {saveLoading ? "Đang lưu..." : "💾 Lưu thay đổi"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Change password card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>Đổi mật khẩu</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>Sử dụng mật khẩu mạnh để bảo vệ tài khoản</div>
                </div>
                <form onSubmit={handleChangePassword} style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Mật khẩu hiện tại", key: "currentPassword" },
                    { label: "Mật khẩu mới",      key: "newPassword" },
                    { label: "Xác nhận mật khẩu", key: "confirmPassword" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>{f.label}</label>
                      <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder="••••••••" style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#0095c7"; e.target.style.boxShadow = "0 0 0 3px rgba(0,149,199,.1)"; }}
                        onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" disabled={pwLoading} style={{ padding: "9px 22px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,.3)" }}>
                      {pwLoading ? "Đang xử lý..." : "🔐 Cập nhật mật khẩu"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ══ TAB: BOOKINGS ══ */}
          {activeTab === "bookings" && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>{isOwner ? "Khách hàng đã thuê" : "Kho bãi đã thuê"}</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>{contracts.length} hợp đồng</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <StatCard icon={isOwner ? "🤝" : "🏭"} value={activeContracts.length} label={isOwner ? "Đang thuê" : "Đang thuê"} color="#10b981" />
                  <StatCard icon="✅" value={completedContracts.length} label="Hoàn tất" color="#6366f1" />
                </div>
              </div>

              {contracts.length === 0 ? (
                <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>{isOwner ? "🤝" : "📭"}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{isOwner ? "Chưa có khách hàng nào thuê kho" : "Chưa có hợp đồng thuê nào"}</div>
                  <div style={{ fontSize: "0.82rem", marginTop: 6 }}>{isOwner ? "Hợp đồng sẽ hiện ở đây khi có khách thuê kho của bạn." : "Tìm và thuê kho ngay!"}</div>
                  {!isOwner && (
                    <button onClick={() => navigate("/warehouses")} style={{ marginTop: 16, padding: "9px 22px", background: "linear-gradient(135deg,#0095c7,#0369a1)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer" }}>
                      Xem kho có sẵn
                    </button>
                  )}
                </div>
              ) : isOwner ? (
                /* ── OWNER: tenant table ── */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {["Mã HĐ", "Khách thuê", "Email", "Kho bãi", "Bắt đầu", "Kết thúc", "Thanh toán/tháng", "Trạng thái"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((c, i) => (
                        <tr key={c.contractId || i} style={{ borderBottom: "1px solid #f8fafc" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "13px 16px", fontWeight: 700, color: "#0095c7", fontFamily: "monospace", whiteSpace: "nowrap" }}>#{c.contractNumber || c.contractId}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#0095c7,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "0.85rem", flexShrink: 0 }}>
                                {(c.renterName || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.88rem" }}>{c.renterName || "—"}</div>
                                {c.renterPhone && <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>{c.renterPhone}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px", color: "#64748b", fontSize: "0.82rem" }}>{c.renterEmail || "—"}</td>
                          <td style={{ padding: "13px 16px", fontWeight: 600, color: "#1e293b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.warehouseName || "—"}</td>
                          <td style={{ padding: "13px 16px", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(c.startDate)}</td>
                          <td style={{ padding: "13px 16px", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(c.endDate)}</td>
                          <td style={{ padding: "13px 16px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{fmtMoney(c.monthlyPayment)}</td>
                          <td style={{ padding: "13px 16px" }}><Badge status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ── RENTER: warehouse table ── */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {["Mã HĐ", "Kho bãi", "Địa chỉ", "Bắt đầu", "Kết thúc", "Thanh toán/tháng", "Trạng thái"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((c, i) => (
                        <tr key={c.contractId || i} style={{ borderBottom: "1px solid #f8fafc" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "13px 16px", fontWeight: 700, color: "#0095c7", fontFamily: "monospace", whiteSpace: "nowrap" }}>#{c.contractNumber || c.contractId}</td>
                          <td style={{ padding: "13px 16px", fontWeight: 600, color: "#1e293b" }}>{c.warehouseName || "—"}</td>
                          <td style={{ padding: "13px 16px", color: "#64748b", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.warehouseAddress || "—"}</td>
                          <td style={{ padding: "13px 16px", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(c.startDate)}</td>
                          <td style={{ padding: "13px 16px", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(c.endDate)}</td>
                          <td style={{ padding: "13px 16px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{fmtMoney(c.monthlyPayment)}</td>
                          <td style={{ padding: "13px 16px" }}><Badge status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: NOTIFICATIONS ══ */}
          {activeTab === "notifications" && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>Thông báo</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 2 }}>{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}</div>
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{ padding: "7px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, color: "#0369a1", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                    ✓ Đọc tất cả
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 12 }}>🔕</div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Không có thông báo nào</div>
                </div>
              ) : (
                <div>
                  {notifications.map((n, i) => (
                    <div key={n.notificationId || i}
                      onClick={() => !n.isRead && handleMarkRead(n.notificationId)}
                      style={{
                        display: "flex", gap: 14, padding: "14px 22px",
                        borderBottom: i < notifications.length - 1 ? "1px solid #f8fafc" : "none",
                        background: n.isRead ? "transparent" : "#f0f9ff",
                        cursor: n.isRead ? "default" : "pointer",
                        transition: "background .15s",
                      }}
                      onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.background = "#e0f2fe"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = n.isRead ? "transparent" : "#f0f9ff"; }}>
                      {/* dot */}
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.isRead ? "#e2e8f0" : "#0095c7", marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: "0.875rem", color: "#1e293b", marginBottom: 3 }}>
                          {n.title || n.message}
                        </div>
                        {n.title && n.message && (
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{n.message}</div>
                        )}
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 4 }}>
                          {fmtDate(n.createdAt)}
                          {!n.isRead && <span style={{ marginLeft: 10, color: "#0095c7", fontWeight: 700 }}>• Chưa đọc</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default ProfilePage;
