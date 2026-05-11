import axiosClient from "./axiosClient";

const contractTemplateService = {
  getOwnerTemplates: async () => {
    const response = await axiosClient.get("/contract-templates/owner");
    return response.data;
  },

  getOwnerDefaultTemplate: async () => {
    const response = await axiosClient.get("/contract-templates/owner/default");
    return response.data;
  },

  createOwnerTemplate: async (payload) => {
    const response = await axiosClient.post("/contract-templates/owner", payload);
    return response.data;
  },

  setDefaultTemplate: async (templateId) => {
    const response = await axiosClient.put(`/contract-templates/owner/${templateId}/default`);
    return response.data;
  },
};

export default contractTemplateService;
