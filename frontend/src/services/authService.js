import axiosClient from "./axiosClient";

const authService = {
  login: async (email, password) => {
    const response = await axiosClient.post("/auth/login", { email, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      console.log("[Login] Response:", response.data);

      // Automatically fetch warehouse context after login
      try {
        const ctxResponse = await axiosClient.get("/auth/warehouse-context");
        const ctx = ctxResponse.data;
        localStorage.setItem("warehouseContext", JSON.stringify(ctx));
        console.log("[WarehouseContext]", ctx);
      } catch (err) {
        console.warn("[WarehouseContext] Failed to fetch context:", err);
      }
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

  googleLogin: async ({ email, fullName, googleId, avatarUrl }) => {
    const response = await axiosClient.post("/auth/google-login", {
      email,
      fullName,
      googleId,
      avatarUrl,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));

      try {
        const ctxResponse = await axiosClient.get("/auth/warehouse-context");
        localStorage.setItem("warehouseContext", JSON.stringify(ctxResponse.data));
      } catch (err) {
        console.warn("[WarehouseContext] Failed:", err);
      }
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("warehouseContext");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getWarehouseContext: () => {
    const ctx = localStorage.getItem("warehouseContext");
    return ctx ? JSON.parse(ctx) : null;
  },

  refreshWarehouseContext: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const ctxResponse = await axiosClient.get("/auth/warehouse-context");
      const ctx = ctxResponse.data;
      localStorage.setItem("warehouseContext", JSON.stringify(ctx));
      return ctx;
    } catch (err) {
      console.warn("[WarehouseContext] Failed to refresh:", err);
      return null;
    }
  },
};

export default authService;
