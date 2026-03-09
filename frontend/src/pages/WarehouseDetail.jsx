import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

const WarehouseDetail = () => {
  const { id } = useParams();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const imageUrl =
    warehouse.images && warehouse.images.length > 0
      ? `http://localhost:5276${warehouse.images[0].url}`
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
                src={imageUrl}
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
                Gửi yêu cầu thuê
              </button>

            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default WarehouseDetail;