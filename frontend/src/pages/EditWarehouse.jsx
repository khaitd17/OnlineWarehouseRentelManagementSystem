import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/axiosClient";
import { uploadWarehouseImage } from "../services/warehouseService";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import RentalAreaManagement from "../components/warehouse/RentalAreaManagement";

const ChonViTri = ({ setLatLng }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLatLng(lat, lng);
    }
  });

  return null;
};

const EditWarehouse = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    openTime: "",
    closeTime: "",
    is24HoursAccess: false,
    description: "",
    images: [],
    status: "",
    legalStatus: "",
    width: "",
    length: "",
    totalArea: ""
  });

  const [uploadLoading, setUploadLoading] = useState(false);

  const loadWarehouse = async () => {

    const res = await api.get(`/Warehouse/${id}`);

    let openTime = "";
    let closeTime = "";

    if (res.data.is24HoursAccess || res.data.operatingHours === "24/7") {
      openTime = "00:00";
      closeTime = "23:59";
    } else if (res.data.operatingHours) {
      const parts = res.data.operatingHours.split(" - ");
      openTime = parts[0] || "08:00";
      closeTime = parts[1] || "18:00";
    }

    setFormData({
      name: res.data.name,
      address: res.data.address,
      lat: res.data.lat || "",
      lng: res.data.lng || "",
      openTime,
      closeTime,
      is24HoursAccess: res.data.is24HoursAccess || (res.data.operatingHours === "24/7"),
      description: res.data.description || "",
      images: res.data.images || [],
      status: ["APPROVED", "PENDING", "REJECTED", "HIDDEN", "DELETED"].includes(res.data.status?.toUpperCase()) 
              ? res.data.status 
              : "PENDING",
      legalStatus: res.data.mainDoorDirection || "",
      width: res.data.width ?? res.data.Width ?? "",
      length: res.data.length ?? res.data.Length ?? "",
      totalArea: res.data.totalArea ?? res.data.TotalArea ?? ""
    });
  };

  useEffect(() => {
    loadWarehouse();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const setLatLng = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng
    }));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    const payload = {
      warehouseId: parseInt(id),
      ownerId: user.userId,
      name: formData.name,
      address: formData.address,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
      description: formData.description,
      is24HoursAccess: formData.is24HoursAccess,
      openTime: formData.is24HoursAccess ? null : formData.openTime,
      closeTime: formData.is24HoursAccess ? null : formData.closeTime,
      operatingHours: formData.is24HoursAccess ? "24/7" : `${formData.openTime} - ${formData.closeTime}`,
      status: formData.status,
      mainDoorDirection: formData.legalStatus,
      totalArea: parseFloat(formData.totalArea) || 0,
      width: formData.width ? parseFloat(formData.width) : null,
      length: formData.length ? parseFloat(formData.length) : null
    };

    await api.put(`/Warehouse/${id}`, payload);
    alert("Cập nhật thông tin kho thành công");
    loadWarehouse();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadLoading(true);
      for (const file of files) {
        await uploadWarehouseImage(id, file, formData.images.length === 0);
      }
      alert("Tải ảnh lên thành công");
      loadWarehouse();
    } catch (err) {
      alert("Lỗi khi tải ảnh lên");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteImage = async (mediaId) => {
    if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    try {
      await api.delete(`/Warehouse/media/${mediaId}`);
      loadWarehouse();
    } catch (err) {
      alert("Lỗi khi xóa ảnh");
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", width: "48px", height: "48px", 
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.025em" }}>
                Cập nhật kho bãi
              </h1>
              <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "1.1rem" }}>
                Tinh chỉnh thông tin và quản lý diện tích thuê tại kho
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ background: "#fff", padding: "8px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ color: "#00b2d6", fontSize: "18px" }}>info</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#475569" }}>ID: WHS-{id.padStart(4, '0')}</span>
            </div>
            <div style={{ 
              padding: "8px 16px", borderRadius: "12px", border: "1px solid", 
              backgroundColor: 
                formData.status === 'APPROVED' ? '#f0fdf4' : 
                formData.status === 'REJECTED' ? '#fef2f2' : 
                formData.status === 'PENDING' ? '#fffbeb' : '#f8fafc',
              borderColor: 
                formData.status === 'APPROVED' ? '#bbf7d0' : 
                formData.status === 'REJECTED' ? '#fecaca' : 
                formData.status === 'PENDING' ? '#fde68a' : '#e2e8f0',
              color: 
                formData.status === 'APPROVED' ? '#166534' : 
                formData.status === 'REJECTED' ? '#991b1b' : 
                formData.status === 'PENDING' ? '#92400e' : '#64748b',
              display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.85rem"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {formData.status === 'APPROVED' ? 'verified' : 
                 formData.status === 'REJECTED' ? 'cancel' : 
                 formData.status === 'PENDING' ? 'history' : 'draft'}
              </span>
              {formData.status === 'APPROVED' ? 'Đã duyệt' : 
               formData.status === 'REJECTED' ? 'Bị từ chối' : 
               formData.status === 'PENDING' ? 'Đang chờ duyệt' : 'Ẩn / Chưa gửi'}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", alignItems: "start" }}>
          
          {/* Left Column: Main Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: "#fff",
                padding: "2.5rem",
                borderRadius: "32px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.04)",
                border: "1px solid #f1f5f9",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem"
              }}
            >
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.3rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ color: "#00b2d6" }}>edit_note</span>
                Thông tin cơ bản
              </h3>

              <div style={groupStyle}>
                <label style={labelStyle}>Tên kho bãi</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập tên kho..."
                  style={inputStyle}
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>Địa chỉ cụ thể</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Số nhà, đường, quận/huyện..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Chiều rộng (m)</label>
                  <input name="width" type="number" value={formData.width} readOnly style={{ ...inputStyle, backgroundColor: "#f1f5f9" }} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Chiều dài (m)</label>
                  <input name="length" type="number" value={formData.length} readOnly style={{ ...inputStyle, backgroundColor: "#f1f5f9" }} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Tổng diện tích (m²)</label>
                  <input name="totalArea" type="number" value={formData.totalArea} readOnly style={{ ...inputStyle, backgroundColor: "#f1f5f9" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Tọa độ Latitude</label>
                  <input name="lat" value={formData.lat} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Tọa độ Longitude</label>
                  <input name="lng" value={formData.lng} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              {/* 24/7 Toggle */}
              <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "16px",
                padding: "20px",
                backgroundColor: formData.is24HoursAccess ? "#f0f9ff" : "#f8fafc",
                borderRadius: "20px",
                border: "2px solid",
                borderColor: formData.is24HoursAccess ? "#00b2d6" : "#e2e8f0",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }} onClick={() => handleChange({ target: { name: 'is24HoursAccess', type: 'checkbox', checked: !formData.is24HoursAccess } })}>
                <div style={{ 
                  width: "48px", height: "48px", borderRadius: "14px", 
                  backgroundColor: formData.is24HoursAccess ? "#00b2d6" : "#cbd5e1", 
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" 
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>schedule</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "1.05rem" }}>Truy cập 24/7</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Kho tự quản hoạt động không giới hạn thời gian</div>
                </div>
                <div style={{ 
                  width: "50px", height: "26px", borderRadius: "20px", 
                  backgroundColor: formData.is24HoursAccess ? "#00b2d6" : "#e2e8f0",
                  position: "relative", transition: "all 0.3s"
                }}>
                  <div style={{ 
                    position: "absolute", top: "3px", 
                    left: formData.is24HoursAccess ? "27px" : "3px",
                    width: "20px", height: "20px", backgroundColor: "#fff", 
                    borderRadius: "50%", transition: "all 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" 
                  }} />
                </div>
              </div>

              {!formData.is24HoursAccess && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", animation: "slideDown 0.3s ease-out" }}>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Giờ mở cửa</label>
                    <input type="time" name="openTime" value={formData.openTime} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Giờ đóng cửa</label>
                    <input type="time" name="closeTime" value={formData.closeTime} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>
              )}

              <div style={groupStyle}>
                <label style={labelStyle}>Loại giấy tờ pháp lý</label>
                <select
                  name="legalStatus"
                  value={formData.legalStatus || ""}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">-- Chọn loại giấy tờ --</option>
                  <option value="BUSINESS_LICENSE">Giấy phép kinh doanh</option>
                  <option value="WAREHOUSE_CERT">Giấy chứng nhận quyền sử dụng kho (Sổ đỏ/hồng)</option>
                  <option value="FIRE_SAFETY">Chứng nhận phòng cháy chữa cháy</option>
                  <option value="OTHER">Tài liệu bổ sung khác</option>
                  <option value="Chưa xác minh">Đang chờ cấp / Chưa bổ sung</option>
                </select>
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>Mô tả kho bãi</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Mô tả các tiện ích, ưu điểm của kho..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "1rem",
                  padding: "18px",
                  borderRadius: "18px",
                  border: "none",
                  background: "linear-gradient(135deg, #0284c7 0%, #00b2d6 100%)",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  boxShadow: "0 10px 25px rgba(2, 132, 199, 0.25)",
                  transition: "all 0.3s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 30px rgba(2, 132, 199, 0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(2, 132, 199, 0.25)"; }}
              >
                <span className="material-symbols-outlined">save</span>
                Lưu thay đổi thông tin
              </button>
            </form>

            {/* Area Management Section */}
            <div style={{ 
              backgroundColor: "#fff", padding: "2.5rem", borderRadius: "32px", 
              boxShadow: "0 20px 50px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" 
            }}>
               <RentalAreaManagement warehouseId={id} />
            </div>
          </div>

          {/* Right Column: Map & Media */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "sticky", top: "20px" }}>
            
            {/* Map Preview */}
            <div style={{ 
              backgroundColor: "#fff", padding: "1.5rem", borderRadius: "32px", 
              boxShadow: "0 20px 50px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" 
            }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "#00b2d6" }}>map</span>
                Vị trí bản đồ
              </h3>
              <div style={{ position: "relative", height: "300px", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <MapContainer
                  center={[formData.lat || 10.762622, formData.lng || 106.660172]}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <ChonViTri setLatLng={setLatLng} />
                  {formData.lat && <Marker position={[formData.lat, formData.lng]} />}
                </MapContainer>
                <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", padding: "8px 12px", borderRadius: "10px", fontSize: "0.75rem", color: "#64748b", zIndex: 1000, border: "1px solid #e2e8f0" }}>
                  Nhấn lên bản đồ để cập nhật tọa độ kho
                </div>
              </div>
            </div>

            {/* Media Gallery */}
            <div style={{ 
              backgroundColor: "#fff", padding: "2rem", borderRadius: "32px", 
              boxShadow: "0 20px 50px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ color: "#00b2d6" }}>photo_library</span>
                  Hình ảnh ({formData.images.length})
                </h3>
                <label style={{ 
                    backgroundColor: "#f0f9ff", color: "#00b2d6", padding: "8px 16px", borderRadius: "10px", 
                    cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px",
                    border: "1px solid #bae6fd", transition: "all 0.2s"
                }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e0f2fe" } onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f0f9ff" }>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_a_photo</span>
                    {uploadLoading ? "..." : "Thêm ảnh"}
                    <input type="file" multiple accept="image/*" hidden onChange={handleImageUpload} disabled={uploadLoading} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                {formData.images.map((img) => {
                  const rawUrl = img.url || img.Url;
                  const imgUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:5276${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
                  return (
                    <div key={img.imageId} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                      <img src={imgUrl} alt="Warehouse" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "8px" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                        <button 
                          onClick={() => handleDeleteImage(img.imageId)}
                          style={{ 
                            background: "#fee2e2", border: "none", borderRadius: "8px", width: "32px", height: "32px", 
                            cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)"
                          }}
                          title="Xóa ảnh"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                        </button>
                      </div>
                      {img.isPrimary && (
                        <div style={{ position: "absolute", top: 8, left: 8, background: "#00b2d6", color: "#fff", fontSize: "10px", padding: "4px 8px", borderRadius: "6px", fontWeight: 800, boxShadow: "0 2px 6px rgba(0, 178, 214, 0.4)" }}>CHÍNH</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {formData.images.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", border: "2px dashed #e2e8f0", borderRadius: "20px" }}>
                   <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px" }}>no_photography</span>
                   <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>Chưa có hình ảnh</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const groupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem"
};

const labelStyle = {
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "#334155"
};

const inputStyle = {
  padding: "14px 18px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  fontSize: "1rem",
  color: "#1e293b",
  outline: "none",
  transition: "all 0.2s ease",
  backgroundColor: "#f8fafc",
  fontFamily: "'Inter', sans-serif"
};

export default EditWarehouse;