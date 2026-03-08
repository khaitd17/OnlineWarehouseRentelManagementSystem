import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
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

  const getWarehouseDetail = async () => {
    try {
      const res = await api.get(`/Warehouse/${id}`);
      setWarehouse(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getWarehouseDetail();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveRequest = async (e) => {
    e.preventDefault();
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
      console.error(err);
      alert("Có lỗi xảy ra khi lưu yêu cầu. Vui lòng thử lại!");
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

          {/* LEFT SIDE */}
          <div>

            {/* IMAGE */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1553413077-190dd305871c"
                alt="warehouse"
                style={{
                  width: "100%",
                  height: "420px",
                  objectFit: "cover"
                }}
              />
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

          {/* RIGHT SIDE */}
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
                    Tổng diện tích
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {warehouse.totalArea} m²
                  </div>
                </div>

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Diện tích còn trống
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {warehouse.availableArea} m²
                  </div>
                </div>

                <div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    Giờ hoạt động
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {warehouse.operatingHours || "Không có thông tin"}
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
                    Diện tích cần thuê (m²) <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="requestedArea"
                    value={formData.requestedArea}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max={warehouse?.availableArea}
                    placeholder={`Tối đa ${warehouse?.availableArea} m²`}
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