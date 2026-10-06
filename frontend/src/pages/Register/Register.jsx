import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const secretKey = searchParams.get('secret_key');

    try {
      const payload = { fullName, email, password };

      if (secretKey) {
        payload.librarianSecretCode = secretKey;
      }

      const response = await api.post('/Auth/register', payload);

      if (response.data.success) {
        console.log('Реєстрація успішна!', response.data.data);
        navigate('/login');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Помилка реєстрації:', err);
      setError(err.response?.data?.message || 'Помилка реєстрації. Перевірте введені дані.');
    }
  };

  return (

    <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl">

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">


        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Створення акаунта
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Приєднуйтесь до нашої бібліотечної системи
          </p>
        </div>

        {searchParams.get('secret_key') && (
          <div className="mb-6 p-3 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 text-sm font-medium rounded-r-md shadow-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Реєстрація співробітника (Бібліотекар)
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md text-sm flex items-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Повне ім'я (ПІБ)</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 shadow-sm"
              placeholder="Іванов Іван Іванович"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
            Зареєструватися
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 font-medium">
          Вже маєте акаунт?{' '}
          <a href="/login" className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
            Увійдіть тут
          </a>
        </div>
      </div>
    </div>
  );
}