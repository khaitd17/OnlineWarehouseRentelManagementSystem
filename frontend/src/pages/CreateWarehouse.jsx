import React, { useState } from "react";
import { createWarehouse } from "../services/warehouseService";

import StepIndicator from "../components/warehouse/StepIndicator";
import Step1WarehouseInfo from "../components/warehouse/Step1WarehouseInfo";
import Step2UploadImages from "../components/warehouse/Step2UploadImages";
import Step3UploadDocuments from "../components/warehouse/Step3UploadDocuments";

const CreateWarehouse = () => {

  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1);
  const [warehouseId, setWarehouseId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    totalArea: "",
    is24HoursAccess: false,
    openTime: "08:00",
    closeTime: "18:00",
    description: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
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
        is24HoursAccess: formData.is24HoursAccess,
        openTime: formData.is24HoursAccess ? null : formData.openTime,
        closeTime: formData.is24HoursAccess ? null : formData.closeTime,
        operatingHours: formData.is24HoursAccess ? "24/7" : `${formData.openTime} - ${formData.closeTime}`
      };

      const id = await createWarehouse(payload);

      setWarehouseId(id);

      setStep(2);

    } catch (error) {

      console.error(error);
      alert("Có lỗi khi tạo kho");

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
            handleSubmit={handleSubmit}
            setLatLng={setLatLng}
          />
        )}

        {step === 2 && (
          <Step2UploadImages
            warehouseId={warehouseId}
            next={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3UploadDocuments
            warehouseId={warehouseId}
            finish={() => setStep(4)}
          />
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
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
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