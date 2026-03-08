import axiosClient from "./axiosClient";

const rentalService = {
  createRentalRequest: async (data) => {
    const response = await axiosClient.post("/rental-requests", data);
    return response.data;
  },

  getMyRentalRequests: async () => {
    const response = await axiosClient.get("/rental-requests/my-requests");
    return response.data;
  },

  getRentalRequestById: async (id) => {
    const response = await axiosClient.get(`/rental-requests/${id}`);
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await axiosClient.get("/rental-requests/pending");
    return response.data;
  },

  approveRentalRequest: async (id, data) => {
    const response = await axiosClient.post(`/rental-requests/${id}/approve`, data);
    return response.data;
  },

  rejectRentalRequest: async (id, data) => {
    const response = await axiosClient.post(`/rental-requests/${id}/reject`, data);
    return response.data;
  },

  cancelRentalRequest: async (id) => {
    const response = await axiosClient.post(`/rental-requests/${id}/cancel`);
    return response.data;
  },

  sendRentalRequest: async (id) => {
    const response = await axiosClient.post(`/rental-requests/${id}/send`);
    return response.data;
  },
};

export default rentalService;
