import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const customMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

const UpdateCenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
};

const ChonViTri = ({ setLatLng, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLatLng(lat, lng);
      if (onLocationSelected) onLocationSelected(lat, lng);
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

  const isMapClickRef = useRef(false);

  const handleLocationSelected = async (lat, lng) => {
    isMapClickRef.current = true;
    try {
      let addressStr = "";
      if (GOOGLE_MAPS_API_KEY) {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=vi`);
        const data = await res.json();
        if (data.results && data.results.length > 0) addressStr = data.results[0].formatted_address;
      } else {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`);
        const data = await res.json();
        if (data && data.display_name) addressStr = data.display_name;
      }
      if (addressStr) handleChange({ target: { name: "address", value: addressStr }});
    } catch (e) { console.error("Geocoding err", e); }
    setTimeout(() => { isMapClickRef.current = false; }, 800);
  };

  useEffect(() => {
    if (isMapClickRef.current || !formData.address || formData.address.trim().length < 5) return;
    
    const handler = setTimeout(async () => {
      try {
        let lat, lng;
        if (GOOGLE_MAPS_API_KEY) {
           const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.address)}&key=${GOOGLE_MAPS_API_KEY}&language=vi`);
           const data = await res.json();
           if (data.results && data.results.length > 0) {
             lat = data.results[0].geometry.location.lat;
             lng = data.results[0].geometry.location.lng;
           }
        } else {
           const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1&accept-language=vi`);
           const data = await res.json();
           if (data && data.length > 0) {
             lat = parseFloat(data[0].lat);
             lng = parseFloat(data[0].lon);
           }
        }
        if (lat && lng) setLatLng(lat, lng);
      } catch (e) { console.error("Forward Geocode err", e); }
    }, 1500);

    return () => clearTimeout(handler);
  }, [formData.address]);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: "#fff",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
        border: "1px solid #f1f5f9",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}
    >
      {/* Step header */}
      <div style={{ paddingBottom: "20px", borderBottom: "1px solid #f1f5f9" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00b2d6", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>
          Bước 1 / 3
        </p>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Thông tin kho</h2>
        <p style={{ fontSize: "0.93rem", color: "#64748b", margin: "6px 0 0" }}>Cung cấp thông tin cơ bản để đăng ký kho trên hệ thống.</p>
      </div>

      {/* Tên kho */}
      <div style={groupStyle}>
        <label style={labelStyle}>Tên kho</label>
        <input
          name="name"
          value={formData.name || ""}
          placeholder="Nhập tên kho"
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>

      {/* Loại kho */}
      <div style={groupStyle}>
        <label style={labelStyle}>Loại kho</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { label: "Kho lạnh / mát" },
            { label: "Kho chung" },
            { label: "Kho tự quản" },
            { label: "Kho xưởng" },
            { label: "Kho ngoại quan" },
            { label: "Khác" }
          ].map(type => {
            const isSelected = formData.warehouseType === type.label;

            return (
              <div 
                key={type.label}
                onClick={() => handleChange({ target: { name: "warehouseType", value: type.label }})}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: isSelected ? "2px solid #00b2d6" : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "#f0f9ff" : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.2s"
                }}
              >
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%", 
                  border: isSelected ? "5px solid #00b2d6" : "1px solid #cbd5e1",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                </div>
                <span style={{ fontSize: "0.95rem", color: "#1e293b", fontWeight: isSelected ? 600 : 400 }}>
                  {type.label}
                </span>
              </div>
            )
          })}
        </div>
        {formData.warehouseType === "Khác" && (
          <input
            name="customWarehouseType"
            value={formData.customWarehouseType || ""}
            placeholder="Nhập loại kho của bạn"
            onChange={handleChange}
            required
            style={{...inputStyle, marginTop: "10px"}}
            autoFocus
          />
        )}
      </div>

      {/* Địa chỉ */}
      <div style={groupStyle}>
        <label style={labelStyle}>Địa chỉ</label>
        <input
          name="address"
          value={formData.address || ""}
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
          center={[formData.lat || 10.762622, formData.lng || 106.660172]}
          zoom={13}
          style={{
            height: "300px",
            borderRadius: "12px"
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <UpdateCenter lat={formData.lat} lng={formData.lng} />
          <ChonViTri setLatLng={setLatLng} onLocationSelected={handleLocationSelected} />

          {formData.lat && (
            <Marker position={[formData.lat, formData.lng]} icon={customMarkerIcon} />
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
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
        <div style={{ ...groupStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Chiều cao (m)</label>
          <input
            name="height"
            type="number"
            min="1"
            step="0.1"
            value={formData.height || ""}
            placeholder="Ví dụ: 5"
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>
      </div>

      {/* Diện tích + Giá thuê/m³ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={groupStyle}>
          <label style={labelStyle}>Tổng thể tích (m³)</label>
          <input
            name="totalArea"
            value={formData.totalArea || ""}
            placeholder="Tự động tính bằng Rộng x Dài x Cao"
            readOnly
            style={{ ...inputStyle, backgroundColor: "#e2e8f0", color: "#475569", cursor: "not-allowed", fontWeight: 700 }}
          />
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>
            Giá thuê/m³ (VNĐ/tháng) <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              name="pricePerM2"
              type="text"
              inputMode="numeric"
              value={formData.pricePerM2
                ? new Intl.NumberFormat("vi-VN").format(formData.pricePerM2)
                : ""}
              placeholder="VD: 150.000"
              onChange={(e) => {
                // Strip all dots/commas/whitespace, keep digits only
                const raw = e.target.value.replace(/[\.\,\s]/g, "");
                if (raw === "" || /^\d+$/.test(raw)) {
                  handleChange({ target: { name: "pricePerM2", value: raw, type: "text" } });
                }
              }}
              required
              style={{ ...inputStyle, paddingRight: "60px" }}
            />
            <span style={{
              position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
              fontSize: "0.8rem", fontWeight: 700, color: "#64748b", pointerEvents: "none"
            }}>₫/m³</span>
          </div>
          {formData.pricePerM2 && formData.totalArea && (
            <div style={{ fontSize: "0.78rem", color: "#0095c7", fontWeight: 600, marginTop: 2 }}>
              ≈ {new Intl.NumberFormat("vi-VN").format(Number(formData.pricePerM2) * Number(formData.totalArea))}&nbsp;₫/tháng (toàn bộ kho)
            </div>
          )}
        </div>

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
              value={formData.openTime || ""}
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
              value={formData.closeTime || ""}
              onChange={handleChange}
              required={!formData.is24HoursAccess}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Mô tả */}
      <div style={groupStyle}>
        <label style={labelStyle}>Mô tả</label>
        <textarea
          name="description"
          rows="4"
          value={formData.description || ""}
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
          marginTop: "1rem",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #00b2d6, #0284c7)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 6px 20px rgba(0,178,214,0.28)",
          transition: "all 0.25s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        <span>Tiếp tục bước tiếp theo</span>
        <span style={{ fontSize: "1.1rem" }}>→</span>
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