import axiosClient from "./axiosClient";

export const getMyWarehouses = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.userId) return [];
  
  const response = await axiosClient.get(`/Warehouse/owner/${user.userId}`);
  return response.data;
};

export const getFeaturedWarehouses = async (limit = 6) => {
  const response = await axiosClient.get("/Warehouse/approved", {
    params: { limit }
  });
  return response.data;
};

export const createWarehouse = async (data) => {
  const response = await axiosClient.post("/Warehouse/create", data);
  return response.data.warehouseId;
};

export const uploadWarehouseImage = async (warehouseId, file, isPrimary = false) => {
  const formData = new FormData();
  formData.append("File", file);
  formData.append("MediaType", "IMAGE");
  formData.append("IsPrimary", isPrimary);

  await axiosClient.post(`/Warehouse/${warehouseId}/media`, formData);
};

export const uploadWarehouseDocument = async (warehouseId, file, documentType) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  await axiosClient.post(`/Warehouse/${warehouseId}/documents`, formData);
};

export const submitWarehouse = async (warehouseId) => {
  await axiosClient.patch(`/Warehouse/${warehouseId}/submit`, {});
};
