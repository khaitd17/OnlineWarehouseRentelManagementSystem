import React, { useState, useEffect } from "react";
import userService from "../services/userService";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    avatarUrl: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await userService.updateProfile(formData);
      alert("Cập nhật thông tin thành công!");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError("Không thể cập nhật thông tin.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div style={{ padding: "2rem", textAlign: "center" }}>Đang tải...</div>;
  if (error && !profile) return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "2rem", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      <h2 style={{ marginBottom: "2rem", color: "#0095c7" }}>Thông tin cá nhân</h2>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600 }}>Họ và tên</label>
            <input name="fullName" value={formData.fullName} onChange={handleInputChange} style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600 }}>Số điện thoại</label>
            <input name="phone" value={formData.phone} onChange={handleInputChange} style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontWeight: 600 }}>Ảnh đại diện (URL)</label>
            <input name="avatarUrl" value={formData.avatarUrl} onChange={handleInputChange} style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" style={{ backgroundColor: "#0095c7", color: "#fff", padding: "0.8rem 1.5rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>Lưu thay đổi</button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ backgroundColor: "#e2e8f0", color: "#475569", padding: "0.8rem 1.5rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          <img 
            src={profile.avatarUrl || "https://www.w3schools.com/howto/img_avatar.png"} 
            alt="Avatar" 
            style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid #f1f5f9" }} 
          />
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.2rem" }}>Họ và tên</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{profile.fullName}</div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.2rem" }}>Email</div>
              <div style={{ fontSize: "1.1rem" }}>{profile.email}</div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.2rem" }}>Số điện thoại</div>
              <div style={{ fontSize: "1.1rem" }}>{profile.phone || "Chưa cập nhật"}</div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.2rem" }}>Vai trò</div>
              <div style={{ display: "inline-block", backgroundColor: "#f1f5f9", padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>{profile.roleName}</div>
            </div>
            <button 
              onClick={() => setIsEditing(true)} 
              style={{ marginTop: "1rem", backgroundColor: "#fff", color: "#0095c7", border: "2px solid #0095c7", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
            >
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
