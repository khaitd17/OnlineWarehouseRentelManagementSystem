import axiosClient from './axiosClient';

const equipmentIncidentService = {
  getIncidentsByWarehouse: async (warehouseId, status = '') => {
    const res = await axiosClient.get(`/equipment-incidents/warehouse/${warehouseId}`, {
      params: { status }
    });
    return res.data;
  },

  getIncidentById: async (id) => {
    const res = await axiosClient.get(`/equipment-incidents/${id}`);
    return res.data;
  },

  reportIncident: async (data) => {
    // data: { equipmentId, title, description, severity, attachments: [{ fileUrl, fileType }] }
    const res = await axiosClient.post('/equipment-incidents/report', data);
    return res.data;
  },

  updateStatus: async (incidentId, newStatus, equipmentStatus) => {
    // data: { incidentId, newStatus, equipmentStatus }
    const res = await axiosClient.patch(`/equipment-incidents/${incidentId}/status`, {
      incidentId,
      newStatus,
      equipmentStatus
    });
    return res.data;
  },

  addComment: async (incidentId, content) => {
    const res = await axiosClient.post(`/equipment-incidents/${incidentId}/comments`, {
      incidentId,
      content
    });
    return res.data;
  },

  uploadAttachments: async (files) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await axiosClient.post('/Upload/incident-attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.attachments; // [{ fileUrl, fileType }]
  }
};

export default equipmentIncidentService;
