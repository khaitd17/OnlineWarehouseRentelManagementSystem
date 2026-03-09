import React, { useState, useEffect } from "react";
import userService from "../services/userService";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    avatarUrl: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        phone: data.phone || "",
        avatarUrl: data.avatarUrl || "",
      });
    } catch (err) {
      setError("Không thể tải thông tin cá nhân.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        const { avatarUrl } = await userService.uploadAvatar(file);
        setFormData({ ...formData, avatarUrl });
        alert("Tải ảnh thành công. Hãy nhấn Lưu thay đổi để hoàn tất.");
      } catch (err) {
        alert("Lỗi khi tải ảnh. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await userService.updateProfile(formData);
      
      const storedUser = JSON.parse(localStorage.getItem('user')) || {};
      storedUser.avatarUrl = formData.avatarUrl;
      localStorage.setItem('user', JSON.stringify(storedUser));
      window.dispatchEvent(new Event('authChange'));

      alert("Cập nhật thông tin thành công!");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError("Không thể cập nhật thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setPassLoading(true);
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      alert("Đổi mật khẩu thành công!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Không thể đổi mật khẩu.");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading && !profile) return <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</div>;
  if (error && !profile) return <div style={{ padding: "4rem", textAlign: "center", color: "#ef4444" }}>{error}</div>;

  const SidebarItem = ({ id, icon, label }) => (
    <div 
      onClick={() => setActiveTab(id)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '12px 16px', 
        borderRadius: '10px', 
        cursor: 'pointer',
        backgroundColor: activeTab === id ? '#e0f2fe' : 'transparent',
        color: activeTab === id ? '#0095c7' : '#475569',
        fontWeight: activeTab === id ? 700 : 500,
        transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ fontSize: '0.95rem' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 80px)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem" }}>
        
        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', marginBottom: '1rem' }}>
            <img src={profile.avatarUrl || "https://i.pravatar.cc/150?u=me"} alt="User" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
            <div>
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{profile.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{profile.roleName}</div>
            </div>
          </div>
          
          <SidebarItem id="profile" icon="👤" label="Thông tin cá nhân" />
          <SidebarItem id="bookings" icon="📦" label="Kho bãi đã thuê" />
          <SidebarItem id="payments" icon="💳" label="Lịch sử thanh toán" />
          <SidebarItem id="settings" icon="⚙️" label="Cài đặt tài khoản" />
          <SidebarItem id="notifications" icon="🔔" label="Thông báo" />
          
          <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚪 Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {activeTab === 'profile' ? (
            <>
              {/* Header Card */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Hồ sơ của tôi</h2>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                    >
                      ✏️ Chỉnh sửa hồ sơ
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>HỌ VÀ TÊN</label>
                      <input name="fullName" value={formData.fullName} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>SỐ ĐIỆN THOẠI</label>
                      <input name="phone" value={formData.phone} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>ẢNH ĐẠI DIỆN</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <img src={formData.avatarUrl || "https://i.pravatar.cc/150?u=me"} alt="Preview" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                        <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize: '0.85rem' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" disabled={loading} style={{ backgroundColor: "#0095c7", color: "#fff", padding: "10px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700 }}>Lưu thay đổi</button>
                      <button type="button" onClick={() => setIsEditing(false)} style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "10px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700 }}>Hủy</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>HỌ VÀ TÊN</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>{profile.fullName}</div>
                      </div>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>ĐỊA CHỈ EMAIL</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>{profile.email}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>SỐ ĐIỆN THOẠI</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>{profile.phone || "Chưa cập nhật"}</div>
                      </div>
                      <div style={{ marginBottom: '1.2rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>VAI TRÒ</div>
                        <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{profile.roleName}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>🏘️</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>02</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Kho bãi đang thuê</div>
                </div>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>📄</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>05</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Hợp đồng hoàn tất</div>
                </div>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '1.5rem' }}>⭐</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>12</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Đánh giá của bạn</div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>Hoạt động gần đây</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { title: "Ký hợp đồng thuê Kho Logistics ABC", time: "2 giờ trước", status: "Succeed" },
                    { title: "Cập nhật ảnh đại diện", time: "Hôm qua, 14:15", status: "Succeed" },
                    { title: "Thanh toán hóa đơn tháng 3", time: "20 Th09, 2024", status: "Succeed" }
                  ].map((act, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0095c7' }}></div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{act.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{act.time}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0095c7' }}>✓ Hoàn tất</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : activeTab === 'settings' ? (
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Cài đặt tài khoản</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>Quản lý bảo mật và mật khẩu của bạn</p>
              </div>

              <div style={{ maxWidth: '500px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Đổi mật khẩu</h3>
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>MẬT KHẨU HIỆN TẠI</label>
                    <input 
                      type="password"
                      name="currentPassword" 
                      value={passwordData.currentPassword} 
                      onChange={handlePasswordChange} 
                      required
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>MẬT KHẨU MỚI</label>
                    <input 
                      type="password"
                      name="newPassword" 
                      value={passwordData.newPassword} 
                      onChange={handlePasswordChange} 
                      required
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>XÁC NHẬN MẬT KHẨU MỚI</label>
                    <input 
                      type="password"
                      name="confirmPassword" 
                      value={passwordData.confirmPassword} 
                      onChange={handlePasswordChange} 
                      required
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                    />
                  </div>
                  
                  <div style={{ marginTop: '0.5rem' }}>
                    <button 
                      type="submit" 
                      disabled={passLoading}
                      style={{ backgroundColor: passLoading ? '#94a3b8' : "#0095c7", color: "#fff", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: passLoading ? 'not-allowed' : "pointer", fontWeight: 700, width: '100%' }}
                    >
                      {passLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
             <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                 Đang cập nhật tính năng...
             </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ProfilePage;

