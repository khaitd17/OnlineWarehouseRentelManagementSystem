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

const CreateWarehouse = () => {

  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1);
  const [warehouseId, setWarehouseId] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(false);

    const [formData, setFormData] = useState({
      name: "",
      warehouseType: "Kho chung",
      customWarehouseType: "",
      address: "",
    lat: "",
    lng: "",
    width: "",
    length: "",
    totalArea: "",
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
        width: data.width || "",
        length: data.length || "",
        totalArea: data.totalArea || "",
        pricePerM2: data.pricePerM2 || "",
        is24HoursAccess: data.operatingHours === "24/7",
        openTime: data.openTime ? data.openTime.substring(0, 5) : "08:00",
        closeTime: data.closeTime ? data.closeTime.substring(0, 5) : "18:00",
        description: data.description || ""
      });
      setWarehouseId(id);
      setExistingImages(data.images || []);
      setExistingDoc(data.documentStatus !== "MISSING" ? { type: data.mainDoorDirection } : null); // Simple indicator

      // Determine the next logical step
      const hasImages = data.images && data.images.length > 0;
      const hasDocs = data.documentStatus && data.documentStatus !== "MISSING";

      if (hasImages && !hasDocs) {
        setStep(3); // Jump to Step 3 if images are present but no docs
      } else if (data.name && data.address) {
        setStep(2); // Jump to Step 2 if basic info is present
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
    setFormData((prev) => {
      const nextData = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "width" || name === "length") {
        const w = parseFloat(nextData.width) || 0;
        const l = parseFloat(nextData.length) || 0;
        if (w > 0 && l > 0) {
          nextData.totalArea = w * l;
        } else {
          nextData.totalArea = "";
        }
      }
      return nextData;
    });
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
    if (!formData.name?.trim()) { alert('Tên kho không được để trống'); return; }
    if (formData.name.trim().length > 255) { alert('Tên kho không được vượt quá 255 ký tự'); return; }
    if (!formData.address?.trim()) { alert('Địa chỉ không được để trống'); return; }
    const totalArea = parseFloat(formData.totalArea);
    if (!formData.totalArea || isNaN(totalArea) || totalArea < 10 || totalArea > 1000000) {
      alert('Diện tích kho phải từ 10 đến 1,000,000 m²'); return;
    }
    const price = parseFloat(formData.pricePerM2);
    if (formData.pricePerM2 && !isNaN(price) && (price < 1000 || price > 100000000)) {
      alert('Giá thuê phải từ 1,000 đến 100,000,000 VNĐ/m²/tháng'); return;
    }
    if (formData.lat && (parseFloat(formData.lat) < -90 || parseFloat(formData.lat) > 90)) {
      alert('Vĩ độ phải từ -90 đến 90'); return;
    }
    if (formData.lng && (parseFloat(formData.lng) < -180 || parseFloat(formData.lng) > 180)) {
      alert('Kinh độ phải từ -180 đến 180'); return;
    }
    if (!formData.is24HoursAccess) {
      if (!formData.openTime || !formData.closeTime) {
        alert('Vui lòng nhập giờ mở cửa và giờ đóng cửa'); return;
      }
      if (formData.openTime >= formData.closeTime) {
        alert('Giờ mở cửa phải trước giờ đóng cửa'); return;
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
        width: formData.width ? parseFloat(formData.width) : null,
        length: formData.length ? parseFloat(formData.length) : null,
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
      setStep(2);
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi lưu bản nháp");
    }
  };

  const handleFinalSubmit = async (docData) => {
    // Since Step 2 and Step 3 now handle their own uploads sequentially,
    // we just need to show the success step.
    setStep(4);
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

      <StepIndicator step={step > 3 ? 3 : step} />

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
            onComplete={handleFinalSubmit}
          />
        )}

        {step === 5 && (
          <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "32px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#00b2d6", animation: "spin 2s linear infinite" }}>sync</span>
            <h2 style={{ marginTop: "24px", color: "#1e293b", fontWeight: 800 }}>Đang tạo kho của bạn...</h2>
            <p style={{ color: "#64748b" }}>Vui lòng đợi giây lát, hệ thống đang xử lý hình ảnh và hồ sơ.</p>
          </div>
        )}

        {step === 4 && (
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
    </div>
  );
};

export default CreateWarehouse;