import axiosClient from "./axiosClient";

const ratingService = {
  // ── Public ──
  getWarehouseRatings: async (warehouseId) => {
    const response = await axiosClient.get(`/ratings/warehouse/${warehouseId}`);
    return response.data;
  },

  // ── Renter ──
  createRating: async (data) => {
    const response = await axiosClient.post("/ratings", data);
    return response.data;
  },

  getMyRatings: async () => {
    const response = await axiosClient.get("/ratings/my-ratings");
    return response.data;
  },

  updateRating: async (ratingId, data) => {
    const response = await axiosClient.put(`/ratings/${ratingId}`, data);
    return response.data;
  },

  deleteRating: async (ratingId) => {
    const response = await axiosClient.delete(`/ratings/${ratingId}`);
    return response.data;
  },

  // ── Owner ──
  replyToRating: async (ratingId, reply) => {
    const response = await axiosClient.post(`/ratings/${ratingId}/reply`, { reply });
    return response.data;
  },

  updateReply: async (ratingId, reply) => {
    const response = await axiosClient.post(`/ratings/${ratingId}/reply`, { reply });
    return response.data;
  },

  deleteReply: async (ratingId) => {
    const response = await axiosClient.delete(`/ratings/${ratingId}/reply`);
    return response.data;
  },

  getOwnerUnrepliedCount: async () => {
    const response = await axiosClient.get('/ratings/owner/unreplied-count');
    return response.data.count ?? 0;
  },

  toggleHideRating: async (ratingId) => {
    const response = await axiosClient.patch(`/ratings/${ratingId}/toggle-hide`);
    return response.data;
  },

  // ── Admin ──
  getAllRatings: async () => {
    const response = await axiosClient.get("/ratings/all");
    return response.data;
  },
};

export default ratingService;
