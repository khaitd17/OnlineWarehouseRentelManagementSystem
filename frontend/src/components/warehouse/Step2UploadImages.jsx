import React, { useState } from "react";
import { uploadWarehouseImage } from "../../services/warehouseService";

const Step2UploadImages = ({ warehouseId, next }) => {

  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {

    const selected = Array.from(e.target.files);

    setFiles(selected);

    const urls = selected.map(file => URL.createObjectURL(file));

    setPreview(urls);
  };

  const handleUpload = async () => {

    if (files.length === 0) {
      alert("Vui lòng chọn ảnh");
      return;
    }

    try {

      setLoading(true);

      for (let i = 0; i < files.length; i++) {

        await uploadWarehouseImage(
          warehouseId,
          files[i],
          i === 0   // ảnh đầu là primary
        );

      }

      next();

    } catch (err) {

      console.error(err);
      alert("Upload ảnh thất bại");

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

      <h2>Upload hình ảnh kho</h2>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
      />

      <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>

        {preview.map((img, i) => (

          <img
            key={i}
            src={img}
            style={{
              width: "150px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "8px"
            }}
          />

        ))}

      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        {loading ? "Đang upload..." : "Tiếp tục"}
      </button>

    </div>

  );

};

export default Step2UploadImages;