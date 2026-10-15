import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/Auth/login', { email, password });
      const token = response.data?.data;

      if (token) {
        // Зберігаємо в обидва ключі для повної сумісності
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('token', token);
        navigate('/dashboard');
      } else {
        setError('Не вдалося отримати токен авторизації.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Неправильний Email або пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Вхід для читачів</h2>

        {error && (
          <div className="p-3 mb-4 bg-red-100 text-red-800 text-sm font-medium rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Електронна пошта</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-600">Пароль</label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Забули пароль?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-sm shadow-md disabled:opacity-50"
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Ще не зареєстровані?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Створити акаунт
          </Link>
        </div>
      </div>
    </div>
  );
}