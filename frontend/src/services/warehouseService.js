import axios from "axios";

const API_URL = "http://localhost:5276/api/Warehouse";

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

  return response.data;
};