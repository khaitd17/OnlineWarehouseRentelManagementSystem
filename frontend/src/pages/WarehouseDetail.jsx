import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/axiosClient";
import rentalService from "../services/rentalService";

const WarehouseDetail = () => {
  const { id } = useParams();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    requestedArea: "",
    startDate: "",
    duration: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const getWarehouseDetail = async () => {
    try {
      const res = await api.get(`/Warehouse/${id}`);
      setWarehouse(res.data);
    } catch (err) {
      console.error("API ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getWarehouseDetail();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Prevent entering more than available volume
    if (name === "requestedArea") {
      const numValue = parseFloat(value);
      if (numValue > warehouse?.availableArea) {
        setFormData({
          ...formData,
          [name]: warehouse.availableArea.toString()
        });
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveRequest = async (e) => {
    e.preventDefault();

    if (parseFloat(formData.requestedArea) > warehouse?.availableArea) {
      alert(`Thể tích yêu cầu không được vượt quá thể tích còn trống (${warehouse.availableArea} m³).`);
      return;
    }

    setSaving(true);

    try {
      await rentalService.createRentalRequest({
        warehouseId: parseInt(id),
        requestedArea: parseFloat(formData.requestedArea),
        startDate: formData.startDate,
        durationMonths: parseInt(formData.duration),
        notes: formData.notes
      });

      alert("Đã lưu yêu cầu thuê kho vào danh sách của bạn!");
      setShowModal(false);
      setFormData({
        requestedArea: "",
        startDate: "",
        duration: "",
        notes: ""
      });
    } catch (err) {
      console.error("Full error:", err);
      console.error("Response data:", err.response?.data);
      console.error("Status:", err.response?.status);
      
      let message;
      if (err.response) {
        // Server responded with error
        const data = err.response.data;
        const mainMsg = data?.message || "";
        const errorDetail = data?.error || "";
        const innerDetail = data?.inner || "";
        message = `[${err.response.status}] ${mainMsg}${errorDetail ? "\nError: " + errorDetail : ""}${innerDetail ? "\nInner: " + innerDetail : ""}`;
      } else if (err.request) {
        message = "Không thể kết nối đến server. Kiểm tra backend đang chạy.";
      } else {
        message = 'Có lỗi xảy ra';
      }
      alert("Lỗi: " + message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        Đang tải dữ liệu kho...
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        Không tìm thấy kho
      </div>
    );
  }

  // Robustly extract images from any possible property name variant
  const allImages = warehouse.images || warehouse.Images || warehouse.warehouseMedia || warehouse.WarehouseMedia || [];
  
  // Debug log to help identify data structure issues
  console.log("Warehouse Data:", warehouse);
  console.log("Extracted Images:", allImages);

  const getImageUrl = (img) => {
    if (!img) return "https://images.unsplash.com/photo-1553413077-190dd305871c";
    
    // Check multiple possible URL property names
    const rawUrl = img.url || img.Url || img.mediaUrl || img.MediaUrl || (typeof img === 'string' ? img : null);
    
    if (!rawUrl) return "https://images.unsplash.com/photo-1553413077-190dd305871c";
    
    // Ensure the URL is absolute
    if (rawUrl.startsWith('http')) return rawUrl;
    
    // Normalize leading slash
    const normalizedUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `http://localhost:5276${normalizedUrl}`;
  };

  const currentImageUrl = allImages.length > 0 
    ? getImageUrl(allImages[activeImage]) 
    : "https://images.unsplash.com/photo-1553413077-190dd305871c";

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>

      {/* HEADER */}
      <section
        style={{
          background: "linear-gradient(to right,#0095c7,#0077a3)",
          padding: "4rem 2rem 7rem",
          color: "#fff"
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              marginBottom: "1rem"
            }}
          >
            {warehouse.name}
          </h1>

          <p
            style={{
              opacity: 0.9,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            📍 {warehouse.address}
          </p>
          <p
            style={{
              opacity: 0.9,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "10px"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>category</span> {warehouse.warehouseType || "Khác"}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "-5rem auto 4rem",
          padding: "0 1.5rem"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,2fr) minmax(320px,1fr)",
            gap: "30px",
            alignItems: "start"
          }}
        >

          {/* LEFT */}
          <div>
            {/* IMAGE GALLERY */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ position: "relative", height: "420px", width: "100%" }}>
                <img
                  src={currentImageUrl}
                  alt="warehouse"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </div>
              
              {allImages.length > 1 && (
                <div style={{ 
                  display: "flex", 
                  gap: "10px", 
                  padding: "15px", 
                  overflowX: "auto", 
                  borderTop: "1px solid #f1f5f9",
                  backgroundColor: "#fff"
                }}>
                  {allImages.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      style={{ 
                        width: "80px", 
                        height: "60px", 
                        borderRadius: "8px", 
                        overflow: "hidden", 
                        cursor: "pointer",
                        border: activeImage === idx ? "2px solid #0095c7" : "2px solid transparent",
                        transition: "all 0.2s"
                      }}
                    >
                      <img 
                        src={getImageUrl(img)} 
                        alt={`thumb-${idx}`} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div
              style={{
                marginTop: "30px",
                background: "#fff",
                padding: "30px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
              }}
            >
              <h2
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  marginBottom: "1rem"
                }}
              >
                Mô tả kho
              </h2>

              <p
                style={{
                  color: "#475569",
                  lineHeight: 1.7
                }}
              >
                {warehouse.description || "Chưa có mô tả cho kho này."}
              </p>
            </div>

            {/* MAP */}
            {warehouse.lat && warehouse.lng && (
              <div
                style={{
                  marginTop: "30px",
                  background: "#fff",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
                }}
              >
                <iframe
                  title="map"
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${warehouse.lat},${warehouse.lng}&z=15&output=embed`}
                ></iframe>
              </div>
            )}

          </div>

          {/* RIGHT */}
          <div
            style={{
              position: "sticky",
              top: "100px",
              height: "fit-content"
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "16px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.08)"
              }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  marginBottom: "20px"
                }}
              >
                Thông tin kho
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px"
                }}
              >

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Loại kho
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {warehouse.warehouseType || "Khác"}
                  </div>
                </div>

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Tổng thể tích
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {warehouse.totalArea} m³
                  </div>
                </div>

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Thể tích còn trống
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {warehouse.availableArea} m³
                  </div>
                </div>

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Giờ hoạt động
                  </div>
                  <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                    {warehouse.is24HoursAccess ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#0ea5e9" }}>schedule</span>
                        <span>24/7 (Truy cập tự quản)</span>
                      </>
                    ) : (
                      warehouse.operatingHours || "Không có thông tin"
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Trạng thái
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        warehouse.status === "APPROVED"
                          ? "#16a34a"
                          : "#f59e0b"
                    }}
                  >
                    {warehouse.status}
                  </div>
                </div>

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Tình trạng tài liệu
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        warehouse.documentStatus === "APPROVED" || warehouse.documentStatus === "VERIFIED"
                          ? "#16a34a"
                          : warehouse.documentStatus === "MISSING"
                          ? "#ef4444"
                          : "#f59e0b"
                    }}
                  >
                    {warehouse.documentStatus === "MISSING" ? "Chưa có" : 
                     warehouse.documentStatus === "PENDING" ? "Đang chờ duyệt" : 
                     warehouse.documentStatus === "APPROVED" ? "Đã xác minh" : warehouse.documentStatus}
                  </div>
                </div>

              </div>

              {/* BUTTON */}
              <button
                onClick={() => setShowModal(true)}
                style={{
                  marginTop: "25px",
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0095c7",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer"
                }}
              >
                Lưu yêu cầu thuê
              </button>

            </div>
          </div>

        </div>
      </section>

      {/* MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "24px",
                color: "#0f172a"
              }}
            >
              Lưu yêu cầu thuê kho
            </h2>

            <form onSubmit={handleSaveRequest}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>
                    Thể tích cần thuê (m³) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="requestedArea"
                    value={formData.requestedArea}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max={warehouse?.availableArea}
                    placeholder={`Tối đa ${warehouse?.availableArea} m³`}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>
                    Ngày bắt đầu <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>
                    Thời hạn thuê (tháng) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="Số tháng thuê"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>
                    Ghi chú
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Thêm ghi chú nếu cần..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0095c7",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu yêu cầu"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default WarehouseDetail;