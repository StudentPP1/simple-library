import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Запит коду, 2 = Скидання пароля

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Крок 1: Запит коду відновлення
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/Auth/forgot-password', { email });
      if (response.data?.success !== false) {
        setMessage({
          type: 'success',
          text: response.data?.message || 'Код відновлення успішно надіслано на ваш Email!',
        });
        setStep(2);
      } else {
        setMessage({
          type: 'error',
          text: response.data?.message || 'Не вдалося надіслати лист.',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Користувача з таким Email не знайдено або виникла помилка.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Крок 2: Встановлення нового пароля
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/Auth/reset-password', {
        email,
        token: token.trim(),
        newPassword,
      });

      if (response.data?.success !== false) {
        setMessage({
          type: 'success',
          text: 'Пароль успішно змінено! Перенаправлення на сторінку входу...',
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: response.data?.message || 'Невірний код або помилка скидання пароля.',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Невірний код відновлення або пароль не відповідає вимогам.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">Відновлення пароля</h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? 'Введіть ваш Email для отримання коду відновлення'
              : 'Введіть код з листа та ваш новий пароль'}
          </p>
        </div>

        {/* Повідомлення про статус */}
        {message.text && (
          <div
            className={`p-3 mb-6 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* КРОК 1: Запит коду */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Електронна пошта
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@example.com"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-sm shadow-md disabled:opacity-50"
            >
              {loading ? 'Надсилання...' : 'Отримати код відновлення'}
            </button>
          </form>
        )}

        {/* КРОК 2: Введення коду та нового пароля */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Електронна пошта
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg bg-gray-50 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Код відновлення (з листа Mailtrap)
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Введіть код/токен з листа"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Новий пароль
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition text-sm shadow-md disabled:opacity-50"
            >
              {loading ? 'Збереження...' : 'Змінити пароль'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-xs text-gray-500 hover:underline text-center"
            >
              ← Повернутися до надсилання коду
            </button>
          </form>
        )}

        <div className="mt-6 text-center border-t pt-4">
          <Link to="/login" className="text-xs text-blue-600 hover:underline font-medium">
            Згадали пароль? Увійти
          </Link>
        </div>
      </div>
    </div>
  );
}