import axiosClient from "./axiosClient";

const authService = {
  login: async (email, password) => {
    const response = await axiosClient.post("/auth/login", { email, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosClient.post("/auth/register", userData);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await axiosClient.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};

export default authService;
