import { useState } from "react";
import { createWarehouse } from "../services/warehouseService";

function CreateWarehouse() {
  const [form, setForm] = useState({
    warehouseName: "",
    description: "",
    address: "",
    city: "",
    province: "",
    area: "",
    pricePerMonth: "",
    warehouseType: "",
    capacity: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await createWarehouse(form, token);
      alert("Tạo kho thành công! Chờ admin duyệt.");
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra!");
    }
  };

  return (
    <div>
      <h2>Tạo Kho Mới</h2>
      <form onSubmit={handleSubmit}>
        <input name="warehouseName" placeholder="Tên kho" onChange={handleChange} required />
        <br />

        <textarea name="description" placeholder="Mô tả" onChange={handleChange} />
        <br />

        <input name="address" placeholder="Địa chỉ" onChange={handleChange} required />
        <br />

        <input name="city" placeholder="Thành phố" onChange={handleChange} required />
        <br />

        <input name="province" placeholder="Tỉnh" onChange={handleChange} required />
        <br />

        <input name="area" type="number" placeholder="Diện tích (m2)" onChange={handleChange} required />
        <br />

        <input name="pricePerMonth" type="number" placeholder="Giá thuê / tháng" onChange={handleChange} required />
        <br />

        <input name="warehouseType" placeholder="Loại kho" onChange={handleChange} required />
        <br />

        <input name="capacity" type="number" placeholder="Sức chứa" onChange={handleChange} required />
        <br />

        <button type="submit">Tạo kho</button>
      </form>
    </div>
  );
}

export default CreateWarehouse;