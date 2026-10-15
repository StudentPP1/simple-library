import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
import Register from './pages/Register/Register';
import Catalog from './pages/Catalog/Catalog';
import Dashboard from './pages/Dashboard/Dashboard';
import ForgotPassword from './pages/Auth/ForgotPassword';

const getUserRole = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
  } catch (error) {
    console.error('Помилка читання токена:', error);
    return null;
  }
};

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = getUserRole();
  const isAuthenticated = !!(localStorage.getItem('token') || localStorage.getItem('jwt_token'));
  const isLibrarian = role === 'Librarian';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
        {/* Шапка з адаптивною навігацією */}
        <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/catalog" onClick={closeMenu}>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wider hover:opacity-90 transition">
                📚 Бібліотека
              </h1>
            </Link>

            {/* Десктопна навігація (Планшети та ПК) */}
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/catalog" className="hover:text-blue-200 transition">
                Каталог
              </Link>

              {isAuthenticated && (
                <Link to="/dashboard" className="hover:text-blue-200 transition">
                  Мій кабінет
                </Link>
              )}

              {isLibrarian && (
                <Link to="/admin" className="hover:text-blue-200 transition">
                  Адмін-панель
                </Link>
              )}

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 px-4 py-2 rounded-md hover:bg-blue-800 transition ml-2 font-semibold"
                >
                  Вийти
                </button>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-700 px-4 py-2 rounded-md hover:bg-blue-800 transition ml-2 font-semibold"
                >
                  Увійти
                </Link>
              )}
            </nav>

            {/* Мобільна кнопка-гамбургер (Смартфони) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-blue-700 focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.829 4.828 4.828-4.828a1 1 0 111.414 1.414l-4.828 4.829 4.828 4.828z"/>
                ) : (
                  <path fillRule="evenodd" d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z"/>
                )}
              </svg>
            </button>
          </div>

          {/* Випадаюче мобільне меню */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-blue-700 px-4 pt-2 pb-4 space-y-2 border-t border-blue-500 animate-fadeIn">
              <Link
                to="/catalog"
                onClick={closeMenu}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
              >
                📖 Каталог
              </Link>

              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                >
                  👤 Мій кабінет
                </Link>
              )}

              {isLibrarian && (
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                >
                  ⚙️ Адмін-панель
                </Link>
              )}

              {isAuthenticated ? (
                <button
                  onClick={() => { closeMenu(); handleLogout(); }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-semibold bg-red-600 hover:bg-red-700 mt-2"
                >
                  🚪 Вийти
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-semibold bg-blue-800 hover:bg-blue-900 mt-2 text-center"
                >
                  🔑 Увійти
                </Link>
              )}
            </div>
          )}
        </header>

        {/* Основний адаптивний контейнер */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 my-2 sm:my-4">
          <Routes>
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/admin"
              element={isLibrarian ? <Admin /> : <Navigate to="/catalog" replace />}
            />

            <Route path="*" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;