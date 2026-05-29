import React, { useState, useEffect } from "react";
import api from "../services/axiosClient";
import {
  createWarehouse,
  uploadWarehouseImage,
  uploadWarehouseDocument,
  submitWarehouse
} from "../services/warehouseService";

import StepIndicator from "../components/warehouse/StepIndicator";
import Step1WarehouseInfo from "../components/warehouse/Step1WarehouseInfo";
import Step2UploadImages from "../components/warehouse/Step2UploadImages";
import Step3UploadDocuments from "../components/warehouse/Step3UploadDocuments";
import PolygonBoundaryEditor from "../components/warehouse/PolygonBoundaryEditor";

const CreateWarehouse = () => {

  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1);
  const [warehouseId, setWarehouseId] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [formData, setFormData] = useState({
    name: "",
    warehouseType: "Kho chung",
    customWarehouseType: "",
    address: "",
    lat: "",
    lng: "",
    totalArea: "",
    height: "",
    pricePerM2: "",
    is24HoursAccess: false,
    openTime: "08:00",
    closeTime: "18:00",
    description: ""
  });

  const [images, setImages] = useState([]); // List of { file, isPrimary, preview }
  const [existingImages, setExistingImages] = useState([]);
  const [documents, setDocuments] = useState(null); // { file, type }
  const [existingDoc, setExistingDoc] = useState(null);
  const [boundaryJson, setBoundaryJson] = useState(null); // floor plan JSON

  // Load draft if ID is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      loadDraft(id);
    }
  }, []);

  const loadDraft = async (id) => {
    try {
      setLoadingDraft(true);
      const res = await api.get(`/Warehouse/${id}`);
      const data = res.data;

      // Map data to form
      const predefinedTypes = ["Kho lạnh / mát", "Kho chung", "Kho tự quản", "Kho xưởng", "Kho ngoại quan"];
      setFormData({
        name: data.name || "",
        warehouseType: !data.warehouseType || predefinedTypes.includes(data.warehouseType) ? (data.warehouseType || "Kho chung") : "Khác",
        customWarehouseType: predefinedTypes.includes(data.warehouseType) ? "" : (data.warehouseType || ""),
        address: data.address || "",
        lat: data.lat || "",
        lng: data.lng || "",
        totalArea: data.totalArea || "",
        height: data.height || "",
        pricePerM2: data.pricePerM2 || "",
        is24HoursAccess: data.operatingHours === "24/7",
        openTime: data.openTime ? data.openTime.substring(0, 5) : "08:00",
        closeTime: data.closeTime ? data.closeTime.substring(0, 5) : "18:00",
        description: data.description || ""
      });
      setWarehouseId(id);
      setExistingImages(data.images || []);
      setExistingDoc(data.documentStatus !== "MISSING" ? { type: data.mainDoorDirection } : null);
      setBoundaryJson(data.boundaryPoints || null);

      // Determine the next logical step
      const hasImages = data.images && data.images.length > 0;
      const hasDocs = data.documentStatus && data.documentStatus !== "MISSING";

      if (hasImages && !hasDocs) {
        setStep(4); // Jump to Step 4 if images are present but no docs
      } else if (data.name && data.address) {
        setStep(2); // Jump to Step 2 (floor plan) if basic info is present
      } else {
        setStep(1); // Stay on Step 1 if basic info is missing
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    } finally {
      setLoadingDraft(false);
    }
  };

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

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    // Frontend validation matching backend CreateWarehouseValidator rules
    if (!formData.name?.trim()) { showToast('Tên kho không được để trống', 'error'); return; }
    if (formData.name.trim().length > 255) { showToast('Tên kho không được vượt quá 255 ký tự', 'error'); return; }
    if (!formData.address?.trim()) { showToast('Địa chỉ không được để trống', 'error'); return; }
    const totalArea = parseFloat(formData.totalArea);
    if (!formData.totalArea || isNaN(totalArea) || totalArea <= 0 || totalArea > 200000) {
      showToast('Diện tích sàn kho phải từ 1 đến 200,000 m²', 'error'); return;
    }
    const height = parseFloat(formData.height);
    if (!formData.height || isNaN(height) || height <= 0 || height > 50) {
      showToast('Chiều cao kho phải từ 0.1 đến 50 m', 'error'); return;
    }
    const price = parseFloat(formData.pricePerM2);
    if (formData.pricePerM2 && !isNaN(price) && (price < 1000 || price > 100000000)) {
      showToast('Giá thuê phải từ 1,000 đến 100,000,000 VNĐ/m²/tháng', 'error'); return;
    }
    if (formData.lat && (parseFloat(formData.lat) < -90 || parseFloat(formData.lat) > 90)) {
      showToast('Vĩ độ phải từ -90 đến 90', 'error'); return;
    }
    if (formData.lng && (parseFloat(formData.lng) < -180 || parseFloat(formData.lng) > 180)) {
      showToast('Kinh độ phải từ -180 đến 180', 'error'); return;
    }
    if (!formData.is24HoursAccess) {
      if (!formData.openTime || !formData.closeTime) {
        showToast('Vui lòng nhập giờ mở cửa và giờ đóng cửa', 'error'); return;
      }
      if (formData.openTime >= formData.closeTime) {
        showToast('Giờ mở cửa phải trước giờ đóng cửa', 'error'); return;
      }
    }
    try {
      const payload = {
        ownerId: user.userId,
        name: formData.name,
        warehouseType: formData.warehouseType === "Khác" ? formData.customWarehouseType : formData.warehouseType,
        address: formData.address,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        description: formData.description,
        totalArea: parseFloat(formData.totalArea),
        height: parseFloat(formData.height),
        pricePerM2: formData.pricePerM2 ? parseFloat(formData.pricePerM2) : null,
        is24HoursAccess: formData.is24HoursAccess,
        openTime: formData.is24HoursAccess ? null : formData.openTime,
        closeTime: formData.is24HoursAccess ? null : formData.closeTime,
        operatingHours: formData.is24HoursAccess ? "24/7" : `${formData.openTime} - ${formData.closeTime}`,
        status: "DRAFT"
      };

      if (warehouseId) {
        await api.put(`/Warehouse/${warehouseId}`, { ...payload, warehouseId: parseInt(warehouseId) });
      } else {
        const id = await createWarehouse(payload);
        setWarehouseId(id);
      }
      setStep(2); // Go to image upload step
    } catch (error) {
      console.error("Lỗi khi lưu bản nháp:", error);
      const rd = error?.response?.data;
      const msg = rd?.message
        || (rd?.errors ? JSON.stringify(rd.errors) : null)
        || (typeof rd === 'string' ? rd : null)
        || error?.message
        || "Có lỗi khi lưu bản nháp";
      showToast(msg, 'error');
    }
  };

  const handleFinalSubmit = async (docData) => {
    setStep(4); // After docs, go to floor plan drawing
  };

  const handleFloorPlanSave = async (jsonString, gateString) => {
    try {
      // Thử PATCH trước (endpoint nhẹ)
      try {
        await api.patch(`/Warehouse/${warehouseId}/boundary`, { boundaryPoints: jsonString, gatePosition: gateString });
      } catch {
        // Fallback: dùng PUT với giá trị mặc định an toàn nếu PATCH chưa có
        const res = await api.get(`/Warehouse/${warehouseId}`);
        const d = res.data;
        await api.put(`/Warehouse/${warehouseId}`, {
          warehouseId: parseInt(warehouseId),
          ownerId: d.ownerId,
          name: d.name || 'Kho mới',
          address: d.address || '.',
          warehouseType: d.warehouseType || 'Khác',
          lat: d.lat || null,
          lng: d.lng || null,
          description: d.description || '',
          is24HoursAccess: d.is24HoursAccess ?? true,
          openTime: null,
          closeTime: null,
          operatingHours: d.operatingHours || '24/7',
          status: d.status,
          mainDoorDirection: d.mainDoorDirection || null,
          totalArea: d.totalArea || 100,
          height: d.height || 3,      // mặc định 3m nếu null
          pricePerM2: d.pricePerM2 || null,
          boundaryPoints: jsonString,
          gatePosition: gateString
        });
      }
      setBoundaryJson(jsonString);
      setStep(5); // Done
    } catch (err) {
      showToast('Lỗi khi lưu sơ đồ: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleFloorPlanSkip = async () => {
    try {
      // Xóa mọi sơ đồ nháp và cổng nếu chủ kho chọn bỏ qua vẽ sơ đồ
      try {
        await api.patch(`/Warehouse/${warehouseId}/boundary`, { boundaryPoints: "", gatePosition: "", clearGrid: true });
      } catch (err) {
        console.warn("Could not clear boundary layout:", err);
      }
      setBoundaryJson(null);
      setStep(5); // Done
    } catch (err) {
      console.error("Lỗi khi bỏ qua sơ đồ:", err);
      setStep(5);
    }
  };

  return (
    <div style={{
      maxWidth: "1000px",
      margin: "60px auto",
      padding: "0 20px",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: 900,
          color: "#1e293b",
          marginBottom: "12px",
          letterSpacing: "-0.5px"
        }}>
          Đưa kho của bạn lên hệ thống
        </h1>
        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
          Hoàn thành 3 bước đơn giản để bắt đầu tiếp cận khách hàng tiềm năng.
        </p>
      </div>

      <StepIndicator step={step} />

      <div style={{ transition: "all 0.4s ease-in-out" }}>
        {step === 1 && (
          <Step1WarehouseInfo
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleStep1Submit}
            setLatLng={setLatLng}
          />
        )}

        {step === 2 && (
          <Step2UploadImages
            warehouseId={warehouseId}
            existingImages={existingImages}
            onBack={() => setStep(1)}
            onImagesSelected={(files) => {
              setImages(files);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <Step3UploadDocuments
            warehouseId={warehouseId}
            existingDoc={existingDoc}
            onBack={() => setStep(2)}
            onComplete={handleFinalSubmit}
          />
        )}

        {step === 4 && (
          <PolygonBoundaryEditor
            totalArea={parseFloat(formData.totalArea) || 100}
            initialJson={boundaryJson}
            onSave={handleFloorPlanSave}
            onSkip={handleFloorPlanSkip}
            inline
          />
        )}


        {step === 5 && (
          <div style={{
            textAlign: "center",
            marginTop: "40px",
            background: "#fff",
            padding: "60px",
            borderRadius: "32px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
            border: "1px solid #f0fdf4"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#f0fdf4",
              color: "#10b981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>verified</span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1e293b", marginBottom: "16px" }}>
              Tạo kho thành công!
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto 32px", lineHeight: 1.6 }}>
              Hồ sơ của bạn đã được gửi đi. Đội ngũ quản trị viên sẽ kiểm tra và phê duyệt kho của bạn trong vòng 24h làm việc.
            </p>
            <button
              onClick={() => window.location.href = "/dashboard"}
              style={{
                padding: "16px 40px",
                background: "#00b2d6",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "1.1rem",
                boxShadow: "0 8px 25px rgba(0, 178, 214, 0.3)",
                transition: "all 0.3s ease"
              }}
            >
              Về trang quản lý
            </button>
          </div>
        )}
      </div>

      {/* Premium Glassmorphic Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          borderRadius: "20px",
          background: toast.type === "success" 
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          boxShadow: toast.type === "success"
            ? "0 10px 30px rgba(16, 185, 129, 0.35)"
            : "0 10px 30px rgba(239, 68, 68, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: "0.95rem",
          minWidth: "280px",
          maxWidth: "420px",
          animation: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transition: "all 0.3s ease"
        }}>
          <style>{`
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(40px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
            }
          `}</style>
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              marginLeft: "8px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateWarehouse;