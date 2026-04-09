import axiosClient from './axiosClient';

const subscriptionService = {
  createSubscription: async (plan) => {
    return axiosClient.post('/Subscriptions/create', { plan });
  }
};

export default subscriptionService;
