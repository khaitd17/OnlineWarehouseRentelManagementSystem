import axiosClient from "./axiosClient";

const userService = {
  getProfile: async () => {
    const response = await axiosClient.get("/users/me");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await axiosClient.put("/users/me", profileData);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosClient.post("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await axiosClient.put("/users/me/password", passwordData);
    return response.data;
  },
};

export default userService;
