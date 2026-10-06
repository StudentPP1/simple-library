import axios from 'axios';

// Створюємо базовий екземпляр axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// interceptor для всіх вихідних запитів
api.interceptors.request.use(
  (config) => {
    // Дістаємо токен з локального сховища браузера
    const token = localStorage.getItem('jwt_token');

    // Якщо токен є, додаємо його в заголовок Authorization
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