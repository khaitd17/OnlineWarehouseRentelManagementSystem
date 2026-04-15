import axiosClient from './axiosClient';

const subscriptionService = {
  createSubscription: async (plan) => {
    return axiosClient.post('/Subscriptions/create', { plan });
  },
  getPackages: async () => {
    return axiosClient.get('/Subscriptions/packages');
  },
  getSubscriptionStatus: async () => {
    return axiosClient.get('/Subscriptions/status');
  },
  getPreview: async (plan) => {
    return axiosClient.get(`/Subscriptions/preview?plan=${plan}`);
  }
};

export default subscriptionService;

