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
};

export default userService;
