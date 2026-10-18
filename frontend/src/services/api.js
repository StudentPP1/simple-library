import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехоплювач запитів: підставляємо токен у заголовок Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехоплювач відповідей: якщо сервер повернув 401 (токен прострочений або недійсний)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Сервер повернув 401 Unauthorized. Токен недійсний.');
      localStorage.removeItem('token');
      localStorage.removeItem('jwt_token');

      // Сповіщаємо додаток про зміну стану авторизації
      window.dispatchEvent(new Event('authChange'));

      // Перенаправляємо на сторінку входу, якщо користувач ще не там
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;