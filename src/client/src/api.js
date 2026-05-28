import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jayalal_coco_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Redirect to login if token is expired/invalid (and not already on login page)
      if (!window.location.pathname.endsWith('/login')) {
        localStorage.removeItem('jayalal_coco_token');
        localStorage.removeItem('jayalal_coco_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
