import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/axiosClient";
import { uploadWarehouseImage, uploadWarehouseDocument, getWarehouseDocuments, deleteWarehouseDocument } from "../services/warehouseService";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import RentalAreaManagement from "../components/warehouse/RentalAreaManagement";
import PolygonBoundaryEditor from "../components/warehouse/PolygonBoundaryEditor";
import { parseBoundary } from "../utils/polygonUtils";

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

const EditWarehouse = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    name: "",
    warehouseType: "Kho chung",
    customWarehouseType: "",
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
    totalArea: "",
    height: "",
    pricePerM2: ""
  });

  const [uploadLoading, setUploadLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [pendingDocDeletes, setPendingDocDeletes] = useState([]);

  // ── Boundary polygon state ──────────────────────────────────────────
  const [showBoundaryEditor, setShowBoundaryEditor] = useState(false);
  const [boundaryJson, setBoundaryJson] = useState(null); // current saved JSON

  const DOC_TYPE_LABELS = {
    BUSINESS_LICENSE: "Giấy phép kinh doanh",
    WAREHOUSE_CERT: "Giấy chứng nhận quyền sử dụng kho",
    FIRE_SAFETY: "Chứng nhận phòng cháy chữa cháy",
    OTHER: "Tài liệu bổ sung khác",
  };

  const loadDocuments = async () => {
    try {
      const docs = await getWarehouseDocuments(id);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  };

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

    const predefinedTypes = ["Kho lạnh / mát", "Kho chung", "Kho tự quản", "Kho xưởng", "Kho ngoại quan"];

    setFormData({
      name: res.data.name,
      warehouseType: !res.data.warehouseType || predefinedTypes.includes(res.data.warehouseType) ? (res.data.warehouseType || "Kho chung") : "Khác",
      customWarehouseType: predefinedTypes.includes(res.data.warehouseType) ? "" : (res.data.warehouseType || ""),
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
      totalArea: res.data.totalArea ?? res.data.TotalArea ?? "",
      height: res.data.height ?? res.data.Height ?? "",
      pricePerM2: res.data.pricePerM2 ?? res.data.PricePerM2 ?? ""
    });
    // Load boundary points
    setBoundaryJson(res.data.boundaryPoints || null);
  };

  useEffect(() => {
    loadWarehouse();
    loadDocuments();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setLatLng = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng
    }));
  };

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
      if (addressStr) setFormData((prev) => ({ ...prev, address: addressStr }));
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

  const handleSubmit = async (e) => {

    e.preventDefault();

    const payload = {
      warehouseId: parseInt(id),
      ownerId: user.userId,
      name: formData.name,
      warehouseType: formData.warehouseType === "Khác" ? formData.customWarehouseType : formData.warehouseType,
      address: formData.address,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
      description: formData.description,
      is24HoursAccess: formData.is24HoursAccess,
      openTime: formData.is24HoursAccess ? null : (formData.openTime || null),
      closeTime: formData.is24HoursAccess ? null : (formData.closeTime || null),
      operatingHours: formData.is24HoursAccess ? "24/7" : `${formData.openTime || "08:00"} - ${formData.closeTime || "18:00"}`,
      status: formData.status,
      mainDoorDirection: formData.legalStatus,
      totalArea: parseFloat(formData.totalArea) || 0,
      height: formData.height ? parseFloat(formData.height) : null,
      pricePerM2: formData.pricePerM2 ? parseFloat(String(formData.pricePerM2).replace(/\./g, "")) : null
    };

    try {
      await api.put(`/Warehouse/${id}`, payload);

      // Execute pending document deletes
      for (const docId of pendingDocDeletes) {
        try {
          await deleteWarehouseDocument(docId);
        } catch (err) {
          console.error("Failed to delete document", docId, err);
        }
      }
      setPendingDocDeletes([]);

      alert("Cập nhật kho thành công!");
      navigate("/my-warehouses");
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật kho thất bại";
      alert("Lỗi: " + msg);
    }
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
                  />
                )}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Diện tích sàn (m²) <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    name="totalArea"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.totalArea}
                    onChange={handleChange}
                    placeholder="VD: 500"
                    style={inputStyle}
                  />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Chiều cao kho (m) <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    name="height"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="VD: 5"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Giá thuê/m² */}
              <div style={groupStyle}>

                <label style={labelStyle}>
                  Giá thuê/m² (VNĐ/tháng) <span style={{ color: "#ef4444" }}>*</span>
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
                      const raw = e.target.value.replace(/[\..,\s]/g, "");
                      if (raw === "" || /^\d+$/.test(raw)) {
                        setFormData(prev => ({ ...prev, pricePerM2: raw }));
                      }
                    }}
                    style={{ ...inputStyle, paddingRight: "60px" }}
                  />
                  <span style={{
                    position: "absolute", right: "18px", top: "50%", transform: "translateY(-50%)",
                    fontSize: "0.85rem", fontWeight: 700, color: "#64748b", pointerEvents: "none"
                  }}>₫/m²</span>
                </div>
                {formData.pricePerM2 && formData.totalArea && (
                  <div style={{ fontSize: "0.82rem", color: "#0095c7", fontWeight: 600, marginTop: 2 }}>
                    ≈ {new Intl.NumberFormat("vi-VN").format(Number(formData.pricePerM2) * Number(formData.totalArea))} ₫/tháng (toàn bộ kho)
                  </div>
                )}
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

                {/* Document Upload Section */}
                <div style={{
                  marginTop: "1rem", padding: "1.2rem", background: "#f8fafc",
                  borderRadius: "16px", border: "1px solid #e2e8f0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="material-symbols-outlined" style={{ color: "#0284c7", fontSize: "20px" }}>description</span>
                      <span style={{ fontWeight: 700, color: "#334155", fontSize: "0.95rem" }}>Giấy tờ đã tải lên ({documents.filter(d => !pendingDocDeletes.includes(d.documentId || d.DocumentId)).length})</span>
                    </div>
                    <label style={{
                      backgroundColor: "#eff6ff", color: "#0284c7", padding: "8px 16px", borderRadius: "10px",
                      cursor: docUploadLoading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.85rem",
                      display: "flex", alignItems: "center", gap: "6px",
                      border: "1px solid #bfdbfe", transition: "all 0.2s",
                      opacity: docUploadLoading ? 0.6 : 1
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
                      {docUploadLoading ? "Đang tải..." : "Tải giấy tờ"}
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        hidden
                        disabled={docUploadLoading || !formData.legalStatus || formData.legalStatus === "Chưa xác minh"}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files);
                          if (files.length === 0) return;
                          const docType = formData.legalStatus;
                          if (!docType || docType === "Chưa xác minh") {
                            alert("Vui lòng chọn loại giấy tờ pháp lý trước khi tải lên.");
                            return;
                          }
                          setDocUploadLoading(true);
                          try {
                            for (const file of files) {
                              await uploadWarehouseDocument(id, file, docType);
                            }
                            await loadDocuments();
                            alert("Tải giấy tờ lên thành công!");
                          } catch (err) {
                            alert("Lỗi khi tải giấy tờ: " + (err.response?.data?.message || 'Có lỗi xảy ra'));
                          } finally {
                            setDocUploadLoading(false);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>

                  {(!formData.legalStatus || formData.legalStatus === "Chưa xác minh") && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a",
                      borderRadius: "10px", marginBottom: "12px"
                    }}>
                      <span className="material-symbols-outlined" style={{ color: "#d97706", fontSize: "18px" }}>info</span>
                      <span style={{ fontSize: "0.82rem", color: "#92400e" }}>
                        Chọn loại giấy tờ pháp lý ở trên trước khi tải ảnh giấy tờ lên.
                      </span>
                    </div>
                  )}

                  {documents.filter(d => !pendingDocDeletes.includes(d.documentId || d.DocumentId)).length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "2rem", color: "#94a3b8",
                      background: "#fff", borderRadius: "12px", border: "1px dashed #cbd5e1"
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 8 }}>folder_open</span>
                      <p style={{ margin: 0, fontSize: "0.9rem" }}>Chưa có giấy tờ nào được tải lên</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                      {documents.filter(d => !pendingDocDeletes.includes(d.documentId || d.DocumentId)).map(doc => {
                        const rawUrl = doc.documentUrl || doc.DocumentUrl;
                        const docUrl = rawUrl?.startsWith("http") ? rawUrl : `http://localhost:5276${rawUrl?.startsWith("/") ? rawUrl : "/" + rawUrl}`;
                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(docUrl);
                        const isPdf = /\.pdf$/i.test(docUrl);
                        return (
                          <div key={doc.documentId || doc.DocumentId} style={{
                            background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0",
                            overflow: "hidden", position: "relative",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                          }}>
                            {/* Preview */}
                            {isImage ? (
                              <a href={docUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={docUrl}
                                  alt={doc.documentType || doc.DocumentType}
                                  style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }}
                                  onError={e => { e.target.style.display = "none"; }}
                                />
                              </a>
                            ) : isPdf ? (
                              <div style={{
                                height: "140px", display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                background: "linear-gradient(135deg, #eff6ff, #dbeafe)", gap: 6
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#2563eb" }}>picture_as_pdf</span>
                                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 600 }}>
                                  Xem PDF
                                </a>
                              </div>
                            ) : (
                              <div style={{
                                height: "140px", display: "flex", alignItems: "center", justifyContent: "center",
                                background: "#f1f5f9"
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#94a3b8" }}>insert_drive_file</span>
                              </div>
                            )}
                            {/* Info */}
                            <div style={{ padding: "10px 12px" }}>
                              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                                {DOC_TYPE_LABELS[doc.documentType || doc.DocumentType] || doc.documentType || doc.DocumentType}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : ""}
                              </div>
                            </div>
                            {/* Delete button */}
                            <button
                              onClick={() => {
                                if (!window.confirm("Bạn có chắc muốn xóa giấy tờ này? (Sẽ xóa khi nhấn Lưu)")) return;
                                const docId = doc.documentId || doc.DocumentId;
                                setPendingDocDeletes(prev => [...prev, docId]);
                              }}
                              style={{
                                position: "absolute", top: 6, right: 6,
                                background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "8px",
                                width: "28px", height: "28px", cursor: "pointer", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
                                transition: "all 0.2s"
                              }}
                              title="Xóa giấy tờ"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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

            {/* Boundary Shape Section */}
            <div style={{
              backgroundColor: "#fff", padding: "2rem", borderRadius: "24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>
                    Sơ đồ kho
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                    {boundaryJson
                      ? `Đã có biên — ${parseBoundary(boundaryJson)?.length || 0} điểm`
                      : 'Mặc định: hình chữ nhật đầy đủ (chưa vẽ biên)'}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowBoundaryEditor(true)}
                    style={{
                      padding: "9px 18px", borderRadius: "10px", fontWeight: 700,
                      fontSize: "0.88rem", cursor: "pointer", border: "none",
                      background: "linear-gradient(135deg,#0095c7,#0284c7)",
                      color: "#fff", boxShadow: "0 4px 12px rgba(0,149,199,0.25)"
                    }}
                  >
                    {boundaryJson ? 'Chỉnh sửa sơ đồ' : 'Vẽ sơ đồ kho'}
                  </button>
                  {boundaryJson && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Xóa sơ đồ kho? Kho sẽ hiển thị hình chữ nhật đầy đủ.')) return;
                        try {
                          await api.patch(`/Warehouse/${id}/boundary`, { boundaryPoints: '' });
                          setBoundaryJson(null);
                          alert('Đã xóa sơ đồ kho.');
                        } catch (err) { alert('Lỗi khi xóa sơ đồ: ' + (err.response?.data?.message || err.message)); }
                      }}
                      style={{
                        padding: "9px 18px", borderRadius: "10px", fontWeight: 700,
                        fontSize: "0.88rem", cursor: "pointer",
                        border: "1px solid #fca5a5", background: "#fff5f5", color: "#dc2626"
                      }}
                    >
                      Xóa sơ đồ
                    </button>
                  )}
                </div>
              </div>
            </div>

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
                  <UpdateCenter lat={formData.lat} lng={formData.lng} />
                  <ChonViTri setLatLng={setLatLng} onLocationSelected={handleLocationSelected} />
                  {formData.lat && <Marker position={[formData.lat, formData.lng]} icon={customMarkerIcon} />}
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
              
              {formData.images.length === 0 && (() => {
                 const FALLBACK_IMAGES = [
                  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
                  "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=600",
                  "https://images.unsplash.com/photo-1565891741441-64926e441838?auto=format&fit=crop&q=80&w=600",
                  "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=600",
                  "https://images.unsplash.com/photo-1624927637280-f033784c1279?auto=format&fit=crop&q=80&w=600"
                ];
                return (
                  <div>
                    <div style={{ marginBottom: "1rem", padding: "12px", background: "#f0f9ff", borderRadius: "12px", border: "1px solid #bae6fd", fontSize: "0.85rem", color: "#0369a1", display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>info</span>
                      Kho sẽ hiển thị ảnh mặc định dưới đây nếu bạn không tải ảnh lên.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', opacity: 0.85 }}>
                      <div style={{ borderRadius: '12px', overflow: 'hidden', height: '240px', gridColumn: "span 2" }}>
                        <img src={FALLBACK_IMAGES[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ borderRadius: '8px', overflow: 'hidden', height: '140px' }}>
                        <img src={FALLBACK_IMAGES[1]} alt="Gallery 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ borderRadius: '8px', overflow: 'hidden', position: 'relative', height: '140px' }}>
                        <img src={FALLBACK_IMAGES[2]} alt="More" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {FALLBACK_IMAGES.length > 3 && (
                          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                            +{FALLBACK_IMAGES.length - 3} ảnh
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Polygon Boundary Editor Modal ── */}
      {showBoundaryEditor && (
        <PolygonBoundaryEditor
          totalArea={parseFloat(formData.totalArea) || 0}
          initialJson={boundaryJson}
          onSave={async (jsonString) => {
            try {
              try {
                await api.patch(`/Warehouse/${id}/boundary`, { boundaryPoints: jsonString });
              } catch {
                // Fallback PUT với safe defaults
                const res = await api.get(`/Warehouse/${id}`);
                const d = res.data;
                await api.put(`/Warehouse/${id}`, {
                  warehouseId: parseInt(id),
                  ownerId: d.ownerId,
                  name: d.name,
                  address: d.address,
                  warehouseType: d.warehouseType || 'Khác',
                  lat: d.lat || null, lng: d.lng || null,
                  description: d.description || '',
                  is24HoursAccess: d.is24HoursAccess ?? true,
                  openTime: d.is24HoursAccess ? null : d.openTime,
                  closeTime: d.is24HoursAccess ? null : d.closeTime,
                  operatingHours: d.operatingHours || '24/7',
                  status: d.status,
                  mainDoorDirection: d.mainDoorDirection || null,
                  totalArea: d.totalArea || 100,
                  height: d.height || 3,
                  pricePerM2: d.pricePerM2 || null,
                  boundaryPoints: jsonString,
                });
              }
              setBoundaryJson(jsonString);
              setShowBoundaryEditor(false);
              alert('Da luu so do kho thanh cong!');
            } catch (err) {
              alert('Loi khi luu so do: ' + (err.response?.data?.message || err.message));
            }
          }}
          onCancel={() => setShowBoundaryEditor(false)}
        />
      )}
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