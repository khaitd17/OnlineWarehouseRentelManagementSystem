import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

// Chấm đỏ tùy chỉnh
const redMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Tự động pan bản đồ khi tọa độ thay đổi
const AutoPan = ({ lat, lng }) => {
  const map = useMap();
  const prevRef = useRef({ lat: null, lng: null });
  useEffect(() => {
    if (lat && lng && (prevRef.current.lat !== lat || prevRef.current.lng !== lng)) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
      prevRef.current = { lat, lng };
    }
  }, [lat, lng, map]);
  return null;
};

// Bắt sự kiện click trên bản đồ
const ClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ─────────────────────────────────────────────────────────────
const Step1WarehouseInfo = ({ formData, handleChange, handleSubmit, setLatLng }) => {
  const [geocoding, setGeocoding] = useState(false);
  const isMapClickRef = useRef(false);

  // Reverse geocode: tọa độ → địa chỉ (Nominatim - miễn phí, không cần API key)
  const reverseGeocode = useCallback(async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`,
        { headers: { "Accept-Language": "vi" } }
      );
      const data = await res.json();
      if (data?.display_name) {
        handleChange({ target: { name: "address", value: data.display_name } });
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
    setGeocoding(false);
  }, [handleChange]);

  // Khi click bản đồ → cập nhật pin + điền địa chỉ
  const handleMapClick = useCallback((lat, lng) => {
    isMapClickRef.current = true;
    setLatLng(lat, lng);
    reverseGeocode(lat, lng);
    setTimeout(() => { isMapClickRef.current = false; }, 2000);
  }, [setLatLng, reverseGeocode]);

  // Forward geocode: nhập địa chỉ → di chuyển bản đồ (Nominatim)
  useEffect(() => {
    if (isMapClickRef.current || !formData.address || formData.address.trim().length < 5) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1&accept-language=vi`
        );
        const data = await res.json();
        if (data?.length > 0) {
          setLatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
        }
      } catch (err) { console.error("Forward geocoding error:", err); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData.address]);

  // Lấy vị trí hiện tại
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) { alert("Trình duyệt không hỗ trợ định vị."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        isMapClickRef.current = true;
        setLatLng(coords.latitude, coords.longitude);
        reverseGeocode(coords.latitude, coords.longitude);
        setTimeout(() => { isMapClickRef.current = false; }, 2000);
      },
      () => alert("Không thể lấy vị trí. Vui lòng cấp quyền hoặc nhập thủ công.")
    );
  };

  const markerPos = formData.lat && formData.lng
    ? [parseFloat(formData.lat), parseFloat(formData.lng)]
    : null;

  const defaultCenter = [10.762622, 106.660172]; // HCM

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: "#fff", padding: "40px", borderRadius: "20px",
        boxShadow: "0 4px 32px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9",
        display: "flex", flexDirection: "column", gap: "1.5rem"
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
        <input name="name" value={formData.name || ""} placeholder="Nhập tên kho" onChange={handleChange} required style={inputStyle} />
      </div>

      {/* Loại kho */}
      <div style={groupStyle}>
        <label style={labelStyle}>Loại kho</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {["Kho lạnh / mát", "Kho chung", "Kho tự quản", "Kho xưởng", "Kho ngoại quan", "Khác"].map(label => {
            const isSelected = formData.warehouseType === label;
            return (
              <div key={label} onClick={() => handleChange({ target: { name: "warehouseType", value: label } })}
                style={{
                  padding: "12px", borderRadius: "12px",
                  border: isSelected ? "2px solid #00b2d6" : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "#f0f9ff" : "#fff",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.2s"
                }}
              >
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: isSelected ? "5px solid #00b2d6" : "1px solid #cbd5e1" }} />
                <span style={{ fontSize: "0.95rem", color: "#1e293b", fontWeight: isSelected ? 600 : 400 }}>{label}</span>
              </div>
            );
          })}
        </div>
        {formData.warehouseType === "Khác" && (
          <input name="customWarehouseType" value={formData.customWarehouseType || ""} placeholder="Nhập loại kho của bạn"
            onChange={handleChange} required style={{ ...inputStyle, marginTop: "10px" }} autoFocus />
        )}
      </div>

      {/* Địa chỉ */}
      <div style={groupStyle}>
        <label style={labelStyle}>
          Địa chỉ
          {geocoding && (
            <span style={{ marginLeft: 8, fontSize: "0.78rem", color: "#00b2d6", fontWeight: 400 }}>
              ⏳ Đang lấy địa chỉ...
            </span>
          )}
        </label>
        <input
          name="address"
          value={formData.address || ""}
          placeholder="Click vào bản đồ bên dưới để tự động điền địa chỉ"
          onChange={handleChange}
          required
          style={{
            ...inputStyle,
            borderColor: geocoding ? "#00b2d6" : "#e2e8f0",
            transition: "border-color 0.3s"
          }}
        />
      </div>

      {/* Bản đồ Leaflet – click để đặt chấm đỏ */}
      <div style={groupStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={labelStyle}>
            Chọn vị trí trên bản đồ
            <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "0.8rem", marginLeft: 6 }}>
              — Click để đặt chấm đỏ, địa chỉ sẽ tự điền
            </span>
          </label>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1.5px solid #00b2d6",
              background: "#f0f9ff", color: "#00b2d6", fontWeight: 600, fontSize: "0.8rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
            }}
          >
            Vị trí của tôi
          </button>
        </div>

        <MapContainer
          center={markerPos || defaultCenter}
          zoom={13}
          style={{ height: "340px", borderRadius: "14px", border: "1px solid #e2e8f0", cursor: "crosshair" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onMapClick={handleMapClick} />
          <AutoPan lat={formData.lat} lng={formData.lng} />
          {markerPos && <Marker position={markerPos} icon={redMarkerIcon} />}
        </MapContainer>

        {markerPos ? (
          <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            Đã đặt vị trí: {parseFloat(formData.lat).toFixed(6)}, {parseFloat(formData.lng).toFixed(6)}
          </div>
        ) : (
          <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 6 }}>
            Chưa chọn vị trí. Click vào bản đồ để đặt chấm đỏ.
          </div>
        )}
      </div>

      {/* Kích thước kho */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        {/* Diện tích sàn */}
        <div style={{ ...groupStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Diện tích sàn (m²) <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            name="totalArea" type="number" min="1" step="0.5"
            value={formData.totalArea || ""}
            placeholder="Ví dụ: 500"
            onChange={handleChange} required style={inputStyle}
          />
        </div>
        {/* Chiều cao */}
        <div style={{ ...groupStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Chiều cao kho (m) <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            name="height" type="number" min="0.1" step="0.1"
            value={formData.height || ""}
            placeholder="Ví dụ: 5"
            onChange={handleChange} required style={inputStyle}
          />
        </div>
      </div>

      {/* Giá thuê */}
      <div style={groupStyle}>
        <label style={labelStyle}>Giá thuê/m² (VNĐ/tháng) <span style={{ color: "#ef4444" }}>*</span></label>
        <div style={{ position: "relative" }}>
          <input
            name="pricePerM2" type="text" inputMode="numeric"
            value={formData.pricePerM2 ? new Intl.NumberFormat("vi-VN").format(formData.pricePerM2) : ""}
            placeholder="VD: 150.000"
            onChange={(e) => {
              const raw = e.target.value.replace(/[.,\s]/g, "");
              if (raw === "" || /^\d+$/.test(raw)) handleChange({ target: { name: "pricePerM2", value: raw, type: "text" } });
            }}
            required style={{ ...inputStyle, paddingRight: "60px" }}
          />
          <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", pointerEvents: "none" }}>₫/m²</span>
        </div>
        {formData.pricePerM2 && formData.totalArea && (
          <div style={{ fontSize: "0.78rem", color: "#0095c7", fontWeight: 600, marginTop: 2 }}>
            ≈ {new Intl.NumberFormat("vi-VN").format(Number(formData.pricePerM2) * Number(formData.totalArea))}&nbsp;₫/tháng
          </div>
        )}
      </div>

      {/* 24/7 */}
      <div
        style={{
          ...groupStyle, flexDirection: "row", alignItems: "center", gap: "12px",
          padding: "16px", backgroundColor: formData.is24HoursAccess ? "#f0f9ff" : "#f8fafc",
          borderRadius: "16px", border: "1px solid", borderColor: formData.is24HoursAccess ? "#00b2d6" : "#e2e8f0",
          cursor: "pointer", transition: "all 0.2s"
        }}
        onClick={() => handleChange({ target: { name: "is24HoursAccess", type: "checkbox", checked: !formData.is24HoursAccess } })}
      >
        <input type="checkbox" name="is24HoursAccess" checked={formData.is24HoursAccess} onChange={handleChange}
          style={{ width: "20px", height: "20px", cursor: "pointer" }} onClick={(e) => e.stopPropagation()} />
        <div>
          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>Cho phép truy cập 24/7</div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Kho tự quản hoạt động không giới hạn thời gian</div>
        </div>
      </div>

      {/* Giờ hoạt động */}
      {!formData.is24HoursAccess && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={groupStyle}>
            <label style={labelStyle}>Giờ mở cửa</label>
            <input type="time" name="openTime" value={formData.openTime || ""} onChange={handleChange} required={!formData.is24HoursAccess} style={inputStyle} />
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Giờ đóng cửa</label>
            <input type="time" name="closeTime" value={formData.closeTime || ""} onChange={handleChange} required={!formData.is24HoursAccess} style={inputStyle} />
          </div>
        </div>
      )}

      {/* Mô tả */}
      <div style={groupStyle}>
        <label style={labelStyle}>Mô tả</label>
        <textarea name="description" rows="4" value={formData.description || ""} placeholder="Mô tả thêm về kho"
          onChange={handleChange} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {/* Submit */}
      <button
        type="submit"
        style={{
          marginTop: "1rem", padding: "14px", borderRadius: "12px", border: "none",
          background: "linear-gradient(135deg, #00b2d6, #0284c7)", color: "#fff",
          fontWeight: 800, cursor: "pointer", fontSize: "1rem",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          boxShadow: "0 6px 20px rgba(0,178,214,0.28)", transition: "all 0.25s ease"
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

const groupStyle = { display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" };
const labelStyle = { fontSize: "0.95rem", fontWeight: 700, color: "#334155" };
const inputStyle = {
  padding: "14px 16px", borderRadius: "14px", border: "1px solid #e2e8f0",
  fontSize: "1rem", color: "#1e293b", outline: "none", transition: "all 0.2s ease", backgroundColor: "#f8fafc"
};

export default Step1WarehouseInfo;