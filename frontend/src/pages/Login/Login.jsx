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
      const response = await api.post('/Auth/login', {
        email,
        password
      });

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
      setError(err.response?.data?.message || 'Помилка з’єднання з сервером. Перевірте дані.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Вхід для читачів
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Увійдіть, щоб переглядати та бронювати книги
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md text-sm flex items-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Електронна пошта</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 shadow-sm"
              placeholder="reader@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Пароль</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 shadow-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all shadow-md transform hover:-translate-y-0.5"
          >
            Увійти
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 font-medium">
          Ще не зареєстровані?{' '}
          <a href="/register" className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
            Створити акаунт
          </a>
        </div>
      </div>
    </div>
  );
}