import axios from 'axios';

// Створюємо базовий екземпляр axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // зчитування з .env
  headers: {
    'Content-Type': 'application/json',
  },
});

// interceptor для всіх вихідних запитів
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;