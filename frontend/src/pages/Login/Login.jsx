import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Звертаємося до AuthController
      const response = await api.post('/Auth/login', {
        email,
        password
      });

      // Бекенд повертає ApiResponse, де токен лежить у response.data.data
      const token = response.data.data;

      if (response.data.success && token) {
        localStorage.setItem('jwt_token', token);
        console.log('Успішна авторизація:', response.data.message);
        navigate('/catalog');
      } else {
        setError(response.data.message || 'Помилка авторизації');
      }
    } catch (err) {
      console.error('Помилка авторизації:', err);
      // Відображаємо помилку з бекенду (наприклад, 401 Unauthorized або 404 NotFound)
      setError(err.response?.data?.message || 'Помилка з’єднання з сервером. Перевірте дані.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Вхід для читачів</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Електронна пошта</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">
            Увійти
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          Ще не зареєстровані? <a href="/register" className="text-blue-600 hover:underline">Створити акаунт</a>
        </div>
      </div>
    </div>
  );
}