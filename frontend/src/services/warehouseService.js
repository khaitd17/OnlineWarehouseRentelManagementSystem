import axios from "axios";

const API_URL = "https://localhost:5001/api/warehouses";

export const createWarehouse = async (data, token) => {
  return await axios.post(API_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};