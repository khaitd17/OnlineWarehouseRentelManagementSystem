import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
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
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    openTime: "",
    closeTime: "",
    description: ""
  });

  const loadWarehouse = async () => {

    const res = await api.get(`/Warehouse/${id}`);

    let openTime = "";
    let closeTime = "";

    if (res.data.operatingHours) {
      const parts = res.data.operatingHours.split(" - ");
      openTime = parts[0] || "";
      closeTime = parts[1] || "";
    }

    setFormData({
      name: res.data.name,
      address: res.data.address,
      lat: res.data.lat || "",
      lng: res.data.lng || "",
      openTime,
      closeTime,
      description: res.data.description || ""
    });
  };

  useEffect(() => {
    loadWarehouse();
  }, []);

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

    const payload = {
      warehouseId: parseInt(id),
      ownerId: user.userId,
      name: formData.name,
      address: formData.address,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
      description: formData.description,
      operatingHours: `${formData.openTime} - ${formData.closeTime}`
    };

    await api.put(`/Warehouse/${id}`, payload);

    alert("Cập nhật kho thành công");
  };

  return (
    <div style={{ maxWidth: "900px", margin: "3rem auto", padding: "0 2rem" }}>

      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0f172a" }}>
          Cập nhật kho
        </h1>
        <p style={{ color: "#64748b" }}>
          Chỉnh sửa thông tin kho của bạn
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

        <div style={groupStyle}>
          <label style={labelStyle}>Tên kho</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Địa chỉ</label>
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* MAP CHỌN VỊ TRÍ */}
        <div style={groupStyle}>
          <label style={labelStyle}>Chọn vị trí trên bản đồ</label>

          <MapContainer
            center={[
              formData.lat || 10.762622,
              formData.lng || 106.660172
            ]}
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

        {/* LAT LNG */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

          <div style={groupStyle}>
            <label style={labelStyle}>Latitude</label>
            <input
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Longitude</label>
            <input
              name="lng"
              value={formData.lng}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

        </div>

        {/* GIỜ HOẠT ĐỘNG */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

          <div style={groupStyle}>
            <label style={labelStyle}>Giờ mở cửa</label>
            <input
              type="time"
              name="openTime"
              value={formData.openTime}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Giờ đóng cửa</label>
            <input
              type="time"
              name="closeTime"
              value={formData.closeTime}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

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
          Cập nhật kho
        </button>

      </form>

      {/* RENTAL AREA MANAGEMENT COMPONENT */}
      <RentalAreaManagement warehouseId={id} />

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

export default EditWarehouse;