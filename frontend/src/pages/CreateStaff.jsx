import { useState } from "react";
import staffService from "../services/staffService";

function CreateStaff() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    warehouseId: "",
    startDate: "",
    endDate: "",
    notes: "",
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
      // convert numeric fields
      const payload = {
        ...form,
        warehouseId: parseInt(form.warehouseId, 10),
        startDate: form.startDate ? form.startDate : null,
        endDate: form.endDate ? form.endDate : null,
      };

      const result = await staffService.createStaff(payload);
      alert("Nhân viên đã được tạo, user id: " + result.staffUserId);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        warehouseId: "",
        startDate: "",
        endDate: "",
        notes: "",
      });
    } catch (error) {
      console.error(error);
      alert("Tạo nhân viên thất bại");
    }
  };

  return (
    <div>
      <h2>Tạo nhân viên</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="fullName"
          placeholder="Họ và tên"
          value={form.fullName}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="phone"
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={handleChange}
        />
        <br />
        <input
          name="warehouseId"
          type="number"
          placeholder="ID kho làm việc"
          value={form.warehouseId}
          onChange={handleChange}
          required
        />
        <br />
        <label>
          Ngày bắt đầu:
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Ngày kết thúc:
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
          />
        </label>
        <br />
        <textarea
          name="notes"
          placeholder="Ghi chú"
          value={form.notes}
          onChange={handleChange}
        />
        <br />
        <button type="submit">Tạo nhân viên</button>
      </form>
    </div>
  );
}

export default CreateStaff;
