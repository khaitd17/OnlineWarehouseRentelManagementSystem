import axios from "axios";

const API_URL = "http://localhost:5276/api/Warehouse";

const getAuth = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return {
    headers: {
      Authorization: `Bearer ${user.token}`,

    }
  };
};

export const createWarehouse = async (data) => {

  const user = JSON.parse(localStorage.getItem("user"));

  const response = await axios.post(
    `${API_URL}/create`,
    data,
    {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }
  );

  return response.data.warehouseId;
};

export const uploadWarehouseImage = async (warehouseId, file, isPrimary = false) => {

  const formData = new FormData();

  formData.append("File", file);
  formData.append("MediaType", "IMAGE");
  formData.append("IsPrimary", isPrimary);

  await axios.post(
    `${API_URL}/${warehouseId}/media`,
    formData,
    getAuth()
  );
};

export const uploadWarehouseDocument = async (warehouseId, file, documentType) => {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("documentType", documentType);

  await axios.post(
    `${API_URL}/${warehouseId}/documents`,
    formData,
    getAuth()
  );
};

export const submitWarehouse = async (warehouseId) => {

  const user = JSON.parse(localStorage.getItem("user"));

  await axios.patch(
    `${API_URL}/${warehouseId}/submit`,
    {},
    {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }
  );
};