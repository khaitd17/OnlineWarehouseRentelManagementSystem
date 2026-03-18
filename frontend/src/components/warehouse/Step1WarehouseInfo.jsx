import React from "react";
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

const Step1WarehouseInfo = ({
  formData,
  handleChange,
  handleSubmit,
  setLatLng
}) => {

  return (
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

      {/* Map */}
      <div style={groupStyle}>
        <label style={labelStyle}>Chọn vị trí trên bản đồ (tùy chọn)</label>

        <MapContainer
          center={[10.762622, 106.660172]}
          zoom={13}
          style={{
            height: "300px",
            borderRadius: "12px"
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

      {/* Lat + Lng */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem"
      }}>

        <div style={groupStyle}>
          <label style={labelStyle}>Latitude</label>
          <input
            name="lat"
            value={formData.lat || ""}
            placeholder="Latitude"
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Longitude</label>
          <input
            name="lng"
            value={formData.lng || ""}
            placeholder="Longitude"
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

      </div>

      {/* Kích thước */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ ...groupStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Chiều rộng (m)</label>
          <input
            name="width"
            type="number"
            min="1"
            step="0.1"
            value={formData.width || ""}
            placeholder="Ví dụ: 20"
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>
        <div style={{ ...groupStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Chiều dài (m)</label>
          <input
            name="length"
            type="number"
            min="1"
            step="0.1"
            value={formData.length || ""}
            placeholder="Ví dụ: 50"
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>
      </div>

      {/* Diện tích */}
      <div style={groupStyle}>
        <label style={labelStyle}>Tổng diện tích mặt sàn (m²)</label>
        <input
          name="totalArea"
          value={formData.totalArea || ""}
          placeholder="Tự động tính bằng Chiều rộng x Chiều dài"
          readOnly
          style={{ ...inputStyle, backgroundColor: "#e2e8f0", color: "#475569", cursor: "not-allowed", fontWeight: 700 }}
        />
      </div>

      {/* 24/7 Access Toggle */}
      <div style={{
        ...groupStyle,
        flexDirection: "row",
        alignItems: "center",
        gap: "12px",
        padding: "16px",
        backgroundColor: formData.is24HoursAccess ? "#f0f9ff" : "#f8fafc",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: formData.is24HoursAccess ? "#00b2d6" : "#e2e8f0",
        cursor: "pointer",
        transition: "all 0.2s"
      }} onClick={() => handleChange({ target: { name: 'is24HoursAccess', type: 'checkbox', checked: !formData.is24HoursAccess } })}>
        <input
          type="checkbox"
          name="is24HoursAccess"
          checked={formData.is24HoursAccess}
          onChange={handleChange}
          style={{ width: "20px", height: "20px", cursor: "pointer" }}
          onClick={(e) => e.stopPropagation()}
        />
        <div>
          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>Cho phép truy cập 24/7</div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Kho tự quản hoạt động không giới hạn thời gian</div>
        </div>
      </div>

      {/* Giờ hoạt động (Chỉ hiện khi KHÔNG phải 24/7) */}
      {!formData.is24HoursAccess && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={groupStyle}>
            <label style={labelStyle}>Giờ mở cửa</label>
            <input
              type="time"
              name="openTime"
              value={formData.openTime}
              onChange={handleChange}
              required={!formData.is24HoursAccess}
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
              required={!formData.is24HoursAccess}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Hướng cửa chính */}
      <div style={groupStyle}>
        <label style={labelStyle}>Hướng cửa chính (Cổng kho)</label>
        <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#64748b" }}>Chọn hướng lối vào chính của kho để hiển thị trên sơ đồ bản đồ.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
          {[
            { id: "TOP", label: "Phía Trên", icon: "arrow_upward" },
            { id: "BOTTOM", label: "Phía Dưới", icon: "arrow_downward" },
            { id: "LEFT", label: "Bên Trái", icon: "arrow_back" },
            { id: "RIGHT", label: "Bên Phải", icon: "arrow_forward" },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleChange({ target: { name: 'mainDoorDirection', value: opt.id } })}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "12px 8px", borderRadius: "12px", border: "1px solid",
                borderColor: formData.mainDoorDirection === opt.id ? "#00b2d6" : "#e2e8f0",
                backgroundColor: formData.mainDoorDirection === opt.id ? "#f0f9ff" : "#fff",
                color: formData.mainDoorDirection === opt.id ? "#00b2d6" : "#64748b",
                fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <span className="material-symbols-outlined">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
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

      {/* Button */}
      <button
        type="submit"
        style={{
          marginTop: "1.5rem",
          padding: "16px",
          borderRadius: "16px",
          border: "none",
          backgroundColor: "#00b2d6",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          boxShadow: "0 8px 25px rgba(0, 178, 214, 0.25)",
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        <span>Tiếp tục bước tiếp theo</span>
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>

    </form>
  );
};

const groupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  marginBottom: "1rem"
};

const labelStyle = {
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "#334155"
};

const inputStyle = {
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  fontSize: "1rem",
  color: "#1e293b",
  outline: "none",
  transition: "all 0.2s ease",
  backgroundColor: "#f8fafc"
};

export default Step1WarehouseInfo;