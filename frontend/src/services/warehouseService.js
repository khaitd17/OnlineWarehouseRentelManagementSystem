import axios from "axios";
import axiosClient from "./axiosClient";

const API_URL = "https://localhost:5001/api/warehouses";

export const createWarehouse = async (data, token) => {
  return await axios.post(API_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getMyWarehouses = async () => {
  try {
    const response = await axiosClient.get("/warehouses/my-warehouses");
    return response.data;
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return [];
  }
};