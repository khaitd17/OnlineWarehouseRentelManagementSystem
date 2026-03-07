import React, { useState } from "react";
import { createWarehouse } from "../services/warehouseService";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

const ChonViTri = ({ setLatLng }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLatLng(lat, lng);
    }
  });

  return null;
};

const CreateWarehousePage = () => {

  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    totalArea: "",
    openTime: "",
    closeTime: "",
    description: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

    try {

      const payload = {
        ownerId: user.userId,
        name: formData.name,
        address: formData.address,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        description: formData.description,
        totalArea: parseFloat(formData.totalArea),
        operatingHours: `${formData.openTime} - ${formData.closeTime}`
      };

      const result = await createWarehouse(payload);

      alert("Tạo kho thành công! ID: " + result);

    } catch (error) {
      console.error(error);
      alert("Có lỗi khi tạo kho");
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "3rem auto", padding: "0 2rem" }}>

      {/* Tiêu đề */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a" }}>
          Tạo kho mới
        </h1>
        <p style={{ color: "#64748b" }}>
          Thêm thông tin kho để bắt đầu cho thuê
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fff",
          padding: "2.5rem",
          borderRadius: "24px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
          border: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}
      >

        {/* Tên kho */}
        <div style={groupStyle}>
          <label style={labelStyle}>Tên kho</label>
          <input
            name="name"
            placeholder="Nhập tên kho"
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        {/* Địa chỉ */}
        <div style={groupStyle}>
          <label style={labelStyle}>Địa chỉ</label>
          <input
            name="address"
            placeholder="Nhập địa chỉ kho"
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        {/* Chọn vị trí trên bản đồ */}
        <div style={groupStyle}>
          <label style={labelStyle}>Chọn vị trí trên bản đồ (tùy chọn)</label>

          <MapContainer
            center={[10.762622, 106.660172]}
            zoom={13}
            style={{
              height: "300px",
              borderRadius: "12px",
              marginTop: "0.5rem"
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ChonViTri setLatLng={setLatLng} />

            {formData.lat && (
              <Marker position={[formData.lat, formData.lng]} />
            )}
          </MapContainer>
        </div>

        {/* Latitude + Longitude */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

          <div style={groupStyle}>
            <label style={labelStyle}>Latitude</label>
            <input
              name="lat"
              value={formData.lat}
              placeholder="Nhập latitude"
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Longitude</label>
            <input
              name="lng"
              value={formData.lng}
              placeholder="Nhập longitude"
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

        </div>

        {/* Diện tích */}
        <div style={groupStyle}>
          <label style={labelStyle}>Tổng diện tích (m²)</label>
          <input
            name="totalArea"
            placeholder="Nhập tổng diện tích"
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        {/* Giờ hoạt động */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

          <div style={groupStyle}>
            <label style={labelStyle}>Giờ mở cửa</label>
            <input
              type="time"
              name="openTime"
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Giờ đóng cửa</label>
            <input
              type="time"
              name="closeTime"
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

        </div>

        {/* Mô tả */}
        <div style={groupStyle}>
          <label style={labelStyle}>Mô tả</label>
          <textarea
            name="description"
            rows="4"
            placeholder="Mô tả thêm về kho"
            onChange={handleChange}
            style={{
              ...inputStyle,
              resize: "vertical"
            }}
          />
        </div>

        {/* Nút tạo kho */}
        <button
          type="submit"
          style={{
            marginTop: "1rem",
            padding: "0.9rem",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#0095c7",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          Tạo kho
        </button>

      </form>

    </div>
  );
};

const groupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem"
};

const labelStyle = {
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "#64748b"
};

const inputStyle = {
  padding: "0.8rem",
  borderRadius: "10px",
  border: "1px solid #e2e8f0"
};

export default CreateWarehousePage;