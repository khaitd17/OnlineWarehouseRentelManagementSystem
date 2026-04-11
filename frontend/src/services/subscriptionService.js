import axiosClient from './axiosClient';

const subscriptionService = {
  createSubscription: async (plan) => {
    return axiosClient.post('/Subscriptions/create', { plan });
  },
  getPackages: async () => {
    return axiosClient.get('/Subscriptions/packages');
  }
};

export default subscriptionService;
