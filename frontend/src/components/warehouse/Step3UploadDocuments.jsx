import React, { useState } from "react";
import {
  uploadWarehouseDocument,
  submitWarehouse
} from "../../services/warehouseService";

const Step3UploadDocuments = ({ warehouseId, finish }) => {

  const [documentType, setDocumentType] = useState("BUSINESS_LICENSE");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {

    try {

      setLoading(true);

      if (file) {

        await uploadWarehouseDocument(
          warehouseId,
          file,
          documentType
        );

      }

      await submitWarehouse(warehouseId);

      finish();

    } catch (err) {

      console.error(err);

      alert("Upload document thất bại");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div
      style={{
        background: "#fff",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
      }}
    >

      <h2>Giấy tờ pháp lý</h2>

      <select
        value={documentType}
        onChange={(e) => setDocumentType(e.target.value)}
      >
        <option value="BUSINESS_LICENSE">Giấy phép kinh doanh</option>
        <option value="WAREHOUSE_CERT">Giấy chứng nhận kho</option>
                <option value="WAREHOUSE_CERT">Đang chờ cấp giấy phép</option>

        <option value="OTHER">Khác</option>
      </select>



      <button
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Đang xử lý..." : "Hoàn tất"}
      </button>

    </div>

  );
};

export default Step3UploadDocuments;