import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login/Login';
import Admin from './pages/Admin/Admin';
import Register from './pages/Register/Register';
import Catalog from './pages/Catalog/Catalog';
import Dashboard from './pages/Dashboard/Dashboard';
import ForgotPassword from './pages/Auth/ForgotPassword';

const getAuthData = () => {
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
  if (!token) return { isAuthenticated: false, role: null };

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
    return { isAuthenticated: true, role };
  } catch (error) {
    return { isAuthenticated: false, role: null };
  }
};

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auth, setAuth] = useState(getAuthData());

  const refreshAuth = () => setAuth(getAuthData());

  useEffect(() => {
    window.addEventListener('authChange', refreshAuth);
    return () => window.removeEventListener('authChange', refreshAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('jwt_token');
    refreshAuth();
    window.location.href = '/login';
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <BrowserRouter>
      {/* Warm White background */}
      <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#25312B] flex flex-col selection:bg-[#E8EFE8] selection:text-[#294E40]">
        {/* Header with Soft Border */}
        <header className="bg-white/90 backdrop-blur-md border-b border-[#E5E7E3] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">

            {/* Logo in Forest Green */}
            <Link to="/catalog" onClick={closeMenu} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#294E40] rounded-xl flex items-center justify-center text-xl text-white shadow-sm group-hover:scale-105 transition duration-200">
                📚
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#25312B]">
                  SimpleLibrary
                </h1>
                <p className="text-[10px] font-bold text-[#69766E] uppercase tracking-wider -mt-1">
                  Електронний каталог
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2 text-sm font-semibold">
              <Link
                to="/catalog"
                className="px-4 py-2 text-[#69766E] hover:text-[#294E40] hover:bg-[#E8EFE8]/60 rounded-xl transition"
              >
                📖 Каталог
              </Link>

              {auth.isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 bg-[#E8EFE8] text-[#294E40] hover:bg-[#dbe7db] rounded-xl transition font-bold flex items-center gap-2 border border-[#E5E7E3]"
                  >
                    <span>👤</span>
                    <span>Мій кабінет</span>
                  </Link>

                  {auth.role === 'Librarian' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 text-[#69766E] hover:text-[#294E40] hover:bg-[#E8EFE8]/60 rounded-xl transition flex items-center gap-1.5"
                    >
                      <span>⚙️</span>
                      <span>Панель адміна</span>
                    </Link>
                  )}

                  <div className="h-4 w-[1px] bg-[#E5E7E3] mx-1"></div>

                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 rounded-xl transition text-xs font-bold"
                  >
                    Вийти
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-[#294E40] hover:bg-[#1f3a30] text-white rounded-xl shadow-sm font-bold transition duration-200"
                >
                  🔑 Увійти
                </Link>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#25312B] hover:bg-[#E8EFE8] rounded-xl focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-[#E5E7E3] px-4 pt-2 pb-4 space-y-2 shadow-lg">
              <Link
                to="/catalog"
                onClick={closeMenu}
                className="block px-4 py-2.5 rounded-xl text-base font-semibold text-[#25312B] hover:bg-[#E8EFE8]"
              >
                📖 Каталог книг
              </Link>

              {auth.isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={closeMenu}
                    className="block px-4 py-2.5 rounded-xl text-base font-bold bg-[#E8EFE8] text-[#294E40]"
                  >
                    👤 Мій кабінет
                  </Link>

                  {auth.role === 'Librarian' && (
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="block px-4 py-2.5 rounded-xl text-base font-semibold text-[#25312B] hover:bg-[#E8EFE8]"
                    >
                      ⚙️ Панель бібліотекаря
                    </Link>
                  )}

                  <button
                    onClick={() => { closeMenu(); handleLogout(); }}
                    className="w-full text-left block px-4 py-2.5 rounded-xl text-base font-bold text-rose-700 hover:bg-rose-50 mt-2"
                  >
                    🚪 Вийти з акаунту
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block px-4 py-2.5 rounded-xl text-base font-bold bg-[#294E40] text-white text-center shadow-md mt-2"
                >
                  🔑 Увійти в систему
                </Link>
              )}
            </div>
          )}
        </header>

        {/* Main Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route
              path="/login"
              element={auth.isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin"
              element={auth.role === 'Librarian' ? <Admin /> : <Navigate to="/catalog" replace />}
            />
            <Route path="*" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}