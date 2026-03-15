import axiosClient from './axiosClient';

const equipmentService = {
  getEquipmentsByWarehouse: async (warehouseId) => {
    const res = await axiosClient.get(`/Equipments/warehouse/${warehouseId}`);
    return res.data;
  },

  addEquipment: async (data) => {
    const res = await axiosClient.post('/Equipments', data);
    return res.data;
  },

  updateEquipment: async (id, data) => {
    const res = await axiosClient.put(`/Equipments/${id}`, { equipmentId: id, ...data });
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await axiosClient.patch(`/Equipments/${id}/status`, { equipmentId: id, status });
    return res.data;
  },

  deleteEquipment: async (id) => {
    const res = await axiosClient.delete(`/Equipments/${id}`);
    return res.data;
  },

  controlEquipment: async (id, command) => {
    const res = await axiosClient.post(`/Equipments/${id}/control`, { equipmentId: id, command });
    return res.data;
  }
};

export default equipmentService;
