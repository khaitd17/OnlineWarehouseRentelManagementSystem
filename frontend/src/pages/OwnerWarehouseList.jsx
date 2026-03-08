import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const OwnerWarehouseList = () => {

  const [warehouses, setWarehouses] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const ownerId = user?.userId;

  const loadWarehouses = async () => {
    try {
      const res = await api.get(`/Warehouse/owner/${ownerId}`);
      setWarehouses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      
      <h1 style={{ marginBottom: "30px" }}>
        Kho của tôi
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: "20px"
        }}
      >
        {warehouses.map((w) => (
          <div
            key={w.warehouseId}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.05)"
            }}
          >

            <h3>{w.name}</h3>

            <p style={{ color: "#64748b" }}>
              📍 {w.address}
            </p>

            <p>
              Tổng diện tích: <b>{w.totalArea} m²</b>
            </p>

            <p>
              Còn trống: <b>{w.availableArea} m²</b>
            </p>

            <p>
              Status: <b>{w.status}</b>
            </p>

<div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

  <button
    style={{
      padding: "10px 15px",
      background: "#0095c7",
      border: "none",
      borderRadius: "8px",
      color: "#fff",
      cursor: "pointer"
    }}
    onClick={() => navigate(`/warehouse-new/${w.warehouseId}`)}
  >
    Xem chi tiết
  </button>

  <button
    style={{
      padding: "10px 15px",
      background: "#f59e0b",
      border: "none",
      borderRadius: "8px",
      color: "#fff",
      cursor: "pointer"
    }}
    onClick={() => navigate(`/warehouse-edit/${w.warehouseId}`)}
  >
    Edit
  </button>

</div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerWarehouseList;