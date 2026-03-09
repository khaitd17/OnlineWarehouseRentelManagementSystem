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

      const id = await createWarehouse(payload);

      setWarehouseId(id);

      setStep(2);

    } catch (error) {

      console.error(error);
      alert("Có lỗi khi tạo kho");

    }

  };

  return (

    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>Tạo kho mới</h1>
      </div>

      <StepIndicator step={step} />

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
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <h2>Tạo Kho Thành Công</h2>
        </div>
      )}

    </div>

  );
};

export default CreateWarehouse;