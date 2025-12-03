//src/services/apiclient
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  // baseURL: 'https://odooerp.staunchtec.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const tenant = JSON.parse(localStorage.getItem('tenant'));

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (tenant?.tenant_id) {
      config.headers['X-Tenant-ID'] = tenant.tenant_id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
