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

export const searchWarehouses = async ({
  province = '',
  district = '',
  warehouseType = '',
  minArea,
  maxArea,
  minPrice,
  maxPrice,
  is24Hours,
  minRating,
  sortBy = 'newest',
  page = 1,
  pageSize = 12
} = {}) => {
  const params = { sortBy, page, pageSize };
  if (province)           params.province      = province;
  if (district)           params.district      = district;
  if (warehouseType)      params.warehouseType = warehouseType;
  if (minArea != null)    params.minArea       = minArea;
  if (maxArea != null)    params.maxArea       = maxArea;
  if (minPrice != null)   params.minPrice      = minPrice;
  if (maxPrice != null)   params.maxPrice      = maxPrice;
  if (is24Hours === true) params.is24Hours     = true;
  if (minRating != null)  params.minRating     = minRating;

  const response = await axiosClient.get("/Warehouse/approved/search", { params });
  return response.data; // { total, page, pageSize, items }
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

export const getOccupancyStats = async () => {
  const response = await axiosClient.get("/Warehouse/occupancy-stats");
  return response.data;
};

// ── Default Export ──────────────────────────────────────────────
const warehouseService = {
  getMyWarehouses,
  getFeaturedWarehouses,
  createWarehouse,
  uploadWarehouseImage,
  uploadWarehouseDocument,
  submitWarehouse,
  getOccupancyStats
};

export default warehouseService;
