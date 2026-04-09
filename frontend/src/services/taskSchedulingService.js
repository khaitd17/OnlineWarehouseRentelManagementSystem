import axiosClient from "./axiosClient";

export async function getMyWarehouses() {
  const res = await axiosClient.get("/staff/my-warehouses");
  return res.data;
}

export async function getTaskTypes() {
  const res = await axiosClient.get("/tasks/types");
  return res.data;
}

export async function getTasks(warehouseId, startDate, endDate) {
  const params = new URLSearchParams({ warehouseId });
  if (startDate) params.append("startDate", startDate instanceof Date ? startDate.toISOString() : startDate);
  if (endDate)   params.append("endDate",   endDate   instanceof Date ? endDate.toISOString()   : endDate);
  const res = await axiosClient.get(`/tasks?${params}`);
  return res.data;
}

export async function createTask(warehouseId, data) {
  const res = await axiosClient.post(`/tasks/create?warehouseId=${warehouseId}`, data);
  return res.data;
}
