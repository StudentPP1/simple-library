import axios from 'axios';

// Створюємо базовий екземпляр axios
// URL 'http://localhost:5000/api' - ASP.NET Core
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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